/**
 * Poll voting database functions
 * Handles vote recording with device/IP uniqueness check
 */

import { db } from './client';
import { RowDataPacket } from 'mysql2';

export interface VoteData {
  pollId: number;
  pollItemId: number;
  deviceId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface VoteResults {
  itemId: number;
  title: string;
  votes: number;
  percentage: number;
  image_url?: string;
}

export interface PollResults {
  pollId: number;
  totalVotes: number;
  items: VoteResults[];
  hasVoted: boolean;
}

/**
 * Record a vote with uniqueness check
 * Returns true if vote recorded, false if already voted
 */
export async function recordVote(vote: VoteData): Promise<boolean> {
  const connection = await db.getConnection();

  try {
    // Start transaction
    await connection.beginTransaction();

    // Check if already voted (by device ID or IP address)
    const [existing] = await connection.query<RowDataPacket[]>(
      `SELECT id FROM poll_votes
       WHERE poll_id = ?
       AND (device_id = ? OR (ip_address = ? AND ip_address IS NOT NULL))`,
      [vote.pollId, vote.deviceId, vote.ipAddress || null]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return false; // Already voted
    }

    // Insert vote
    await connection.query(
      `INSERT INTO poll_votes (poll_id, poll_item_id, device_id, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?)`,
      [
        vote.pollId,
        vote.pollItemId,
        vote.deviceId,
        vote.ipAddress || null,
        vote.userAgent || null
      ]
    );

    // Update vote count on poll item
    await connection.query(
      `UPDATE poll_items
       SET vote_count = vote_count + 1
       WHERE id = ?`,
      [vote.pollItemId]
    );

    // Commit transaction
    await connection.commit();
    return true;

  } catch (error) {
    // Rollback on error
    await connection.rollback();
    console.error('Error recording vote:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Check if a user has already voted
 */
export async function checkVoteStatus(
  pollId: number,
  deviceId: string,
  ipAddress?: string
): Promise<{ hasVoted: boolean; votedItemId?: number }> {
  const result = await db.query<RowDataPacket>(
    `SELECT poll_item_id
     FROM poll_votes
     WHERE poll_id = ?
     AND (device_id = ? OR (ip_address = ? AND ip_address IS NOT NULL))
     LIMIT 1`,
    [pollId, deviceId, ipAddress || null]
  );

  if (result.rows.length > 0) {
    return {
      hasVoted: true,
      votedItemId: result.rows[0].poll_item_id
    };
  }

  return { hasVoted: false };
}

/**
 * Get vote counts and percentages for a poll
 */
export async function getVoteResults(pollId: number): Promise<VoteResults[]> {
  // Get total votes
  const totalResult = await db.query<RowDataPacket>(
    `SELECT COUNT(*) as total FROM poll_votes WHERE poll_id = ?`,
    [pollId]
  );
  const totalVotes = totalResult.rows[0].total || 0;

  // Get vote counts per item
  const result = await db.query<RowDataPacket>(
    `SELECT
      pi.id as itemId,
      pi.title,
      pi.image_url,
      pi.vote_count as votes
     FROM poll_items pi
     WHERE pi.poll_id = ?
     ORDER BY pi.display_order, pi.id`,
    [pollId]
  );

  // Calculate percentages
  return result.rows.map(item => ({
    itemId: item.itemId,
    title: item.title,
    votes: item.votes || 0,
    percentage: totalVotes > 0 ? Math.round((item.votes / totalVotes) * 100) : 0,
    image_url: item.image_url
  }));
}

/**
 * Get complete poll results with vote status
 */
export async function getPollResults(
  pollId: number,
  deviceId?: string,
  ipAddress?: string
): Promise<PollResults> {
  // Get vote results
  const items = await getVoteResults(pollId);
  const totalVotes = items.reduce((sum, item) => sum + item.votes, 0);

  // Check if user has voted
  let hasVoted = false;
  if (deviceId) {
    const voteStatus = await checkVoteStatus(pollId, deviceId, ipAddress);
    hasVoted = voteStatus.hasVoted;
  }

  return {
    pollId,
    totalVotes,
    items,
    hasVoted
  };
}

/**
 * Get vote statistics for a poll
 */
export async function getVoteStatistics(pollId: number): Promise<{
  totalVotes: number;
  uniqueDevices: number;
  uniqueIps: number;
  votesPerDay: any[];
  topItems: any[];
}> {
  // Total votes
  const totalResult = await db.query<RowDataPacket>(
    `SELECT COUNT(*) as total FROM poll_votes WHERE poll_id = ?`,
    [pollId]
  );
  const totalVotes = totalResult.rows[0].total || 0;

  // Unique devices
  const deviceResult = await db.query<RowDataPacket>(
    `SELECT COUNT(DISTINCT device_id) as count FROM poll_votes WHERE poll_id = ?`,
    [pollId]
  );
  const uniqueDevices = deviceResult.rows[0].count || 0;

  // Unique IPs
  const ipResult = await db.query<RowDataPacket>(
    `SELECT COUNT(DISTINCT ip_address) as count
     FROM poll_votes
     WHERE poll_id = ? AND ip_address IS NOT NULL`,
    [pollId]
  );
  const uniqueIps = ipResult.rows[0].count || 0;

  // Votes per day (last 7 days)
  const dailyResult = await db.query<RowDataPacket>(
    `SELECT
      DATE(created_at) as date,
      COUNT(*) as votes
     FROM poll_votes
     WHERE poll_id = ?
     AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     GROUP BY DATE(created_at)
     ORDER BY date DESC`,
    [pollId]
  );
  const votesPerDay = dailyResult.rows;

  // Top voted items
  const topResult = await db.query<RowDataPacket>(
    `SELECT
      pi.title,
      pi.vote_count,
      ROUND((pi.vote_count * 100.0 / ?) , 2) as percentage
     FROM poll_items pi
     WHERE pi.poll_id = ?
     ORDER BY pi.vote_count DESC
     LIMIT 5`,
    [totalVotes || 1, pollId]
  );
  const topItems = topResult.rows;

  return {
    totalVotes,
    uniqueDevices,
    uniqueIps,
    votesPerDay,
    topItems
  };
}

/**
 * Delete all votes for a poll (for testing or admin reset)
 */
export async function resetPollVotes(pollId: number): Promise<void> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Delete all votes
    await connection.query(
      `DELETE FROM poll_votes WHERE poll_id = ?`,
      [pollId]
    );

    // Reset vote counts
    await connection.query(
      `UPDATE poll_items SET vote_count = 0 WHERE poll_id = ?`,
      [pollId]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get voter details for admin (with privacy consideration)
 */
export async function getVoterDetails(
  pollId: number,
  limit: number = 100
): Promise<any[]> {
  const result = await db.query<RowDataPacket>(
    `SELECT
      pv.id,
      pv.poll_item_id,
      pi.title as voted_for,
      pv.device_id,
      pv.ip_address,
      pv.user_agent,
      pv.created_at
     FROM poll_votes pv
     JOIN poll_items pi ON pv.poll_item_id = pi.id
     WHERE pv.poll_id = ?
     ORDER BY pv.created_at DESC
     LIMIT ?`,
    [pollId, limit]
  );

  return result.rows;
}

/**
 * Recalculate vote counts (maintenance function)
 * Use this if vote counts get out of sync
 */
export async function recalculateVoteCounts(pollId: number): Promise<void> {
  await db.update(
    `UPDATE poll_items pi
     SET vote_count = (
       SELECT COUNT(*)
       FROM poll_votes pv
       WHERE pv.poll_item_id = pi.id
     )
     WHERE pi.poll_id = ?`,
    [pollId]
  );
}