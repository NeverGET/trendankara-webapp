/**
 * Poll database operations
 * Handles vote counting since we can't use triggers in production
 */

import { db } from './client';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface PollVote {
  pollId: number;
  pollItemId: number;
  deviceId: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Record a vote and update the vote count
 * This replaces the database trigger functionality
 */
export async function recordVote(vote: PollVote): Promise<boolean> {
  const connection = await db.getConnection();

  try {
    // Start transaction
    await connection.beginTransaction();

    // Check if already voted
    const [existing] = await connection.execute<RowDataPacket[]>(
      `SELECT id FROM poll_votes
       WHERE poll_id = ? AND device_id = ? AND ip_address = ?`,
      [vote.pollId, vote.deviceId, vote.ipAddress || null]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return false; // Already voted
    }

    // Insert vote
    await connection.execute<ResultSetHeader>(
      `INSERT INTO poll_votes (poll_id, poll_item_id, device_id, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?)`,
      [vote.pollId, vote.pollItemId, vote.deviceId, vote.ipAddress || null, vote.userAgent || null]
    );

    // Update vote count (replacing trigger functionality)
    await connection.execute<ResultSetHeader>(
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
    return false;
  } finally {
    connection.release();
  }
}

/**
 * Get active polls
 */
export async function getActivePolls() {
  const result = await db.query<RowDataPacket>(
    `SELECT p.*,
            (SELECT COUNT(*) FROM poll_votes WHERE poll_id = p.id) as total_votes
     FROM polls p
     WHERE p.is_active = true
     AND p.deleted_at IS NULL
     AND NOW() BETWEEN p.start_date AND p.end_date
     ORDER BY p.created_at DESC`
  );

  const polls = result.rows;

  // Get poll items for each poll
  for (const poll of polls) {
    const itemResult = await db.query<RowDataPacket>(
      `SELECT * FROM poll_items
       WHERE poll_id = ? AND is_active = true
       ORDER BY display_order, id`,
      [poll.id]
    );
    poll.items = itemResult.rows;
  }

  return polls;
}

/**
 * Get poll by ID with items
 */
export async function getPollById(pollId: number) {
  const result = await db.query<RowDataPacket>(
    `SELECT * FROM polls WHERE id = ? AND deleted_at IS NULL`,
    [pollId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const poll = result.rows[0];

  // Get poll items
  const itemResult = await db.query<RowDataPacket>(
    `SELECT * FROM poll_items
     WHERE poll_id = ? AND is_active = true
     ORDER BY display_order, id`,
    [pollId]
  );

  poll.items = itemResult.rows;
  return poll;
}

/**
 * Check if user has voted
 */
export async function hasVoted(pollId: number, deviceId: string, ipAddress?: string): Promise<boolean> {
  const result = await db.query<RowDataPacket>(
    `SELECT id FROM poll_votes
     WHERE poll_id = ? AND (device_id = ? OR ip_address = ?)
     LIMIT 1`,
    [pollId, deviceId, ipAddress || '']
  );

  return result.rows.length > 0;
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