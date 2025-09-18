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

// Admin CRUD Operations

export interface PollData {
  title: string;
  description?: string;
  poll_type?: 'weekly' | 'monthly' | 'custom';
  start_date: string;
  end_date: string;
  is_active?: boolean;
  show_on_homepage?: boolean;
  created_by: number;
}

export interface PollItemData {
  title: string;
  description?: string;
  image_url?: string;
  display_order?: number;
  is_active?: boolean;
}

/**
 * Get all polls for admin (includes inactive and deleted)
 */
export async function getAllPolls() {
  const result = await db.query<RowDataPacket>(
    `SELECT p.*,
            u.name as creator_name,
            (SELECT COUNT(*) FROM poll_votes WHERE poll_id = p.id) as total_votes,
            (SELECT COUNT(*) FROM poll_items WHERE poll_id = p.id AND is_active = true) as item_count
     FROM polls p
     LEFT JOIN users u ON p.created_by = u.id
     WHERE p.deleted_at IS NULL
     ORDER BY p.created_at DESC`
  );
  return result.rows;
}

/**
 * Create a new poll
 */
export async function createPoll(data: PollData) {
  const result = await db.insert(
    `INSERT INTO polls (title, description, poll_type, start_date, end_date, is_active, show_on_homepage, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      data.description || null,
      data.poll_type || 'custom',
      data.start_date,
      data.end_date,
      data.is_active !== false ? 1 : 0,
      data.show_on_homepage !== false ? 1 : 0,
      data.created_by
    ]
  );
  return result.insertId;
}

/**
 * Update an existing poll
 */
export async function updatePoll(pollId: number, data: Partial<PollData>) {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) {
    fields.push('title = ?');
    values.push(data.title);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    values.push(data.description);
  }
  if (data.poll_type !== undefined) {
    fields.push('poll_type = ?');
    values.push(data.poll_type);
  }
  if (data.start_date !== undefined) {
    fields.push('start_date = ?');
    values.push(data.start_date);
  }
  if (data.end_date !== undefined) {
    fields.push('end_date = ?');
    values.push(data.end_date);
  }
  if (data.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(data.is_active ? 1 : 0);
  }
  if (data.show_on_homepage !== undefined) {
    fields.push('show_on_homepage = ?');
    values.push(data.show_on_homepage ? 1 : 0);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  fields.push('updated_at = NOW()');
  values.push(pollId);

  await db.update(
    `UPDATE polls SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
    values
  );
}

/**
 * Soft delete a poll
 */
export async function deletePoll(pollId: number) {
  await db.update(
    `UPDATE polls SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
    [pollId]
  );
}

/**
 * Get poll items for a specific poll
 */
export async function getPollItems(pollId: number) {
  const result = await db.query<RowDataPacket>(
    `SELECT * FROM poll_items
     WHERE poll_id = ?
     ORDER BY display_order, id`,
    [pollId]
  );
  return result.rows;
}

/**
 * Create a new poll item
 */
export async function createPollItem(pollId: number, data: PollItemData) {
  const result = await db.insert(
    `INSERT INTO poll_items (poll_id, title, description, image_url, display_order, is_active)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      pollId,
      data.title,
      data.description || null,
      data.image_url || null,
      data.display_order || 0,
      data.is_active !== false ? 1 : 0
    ]
  );
  return result.insertId;
}

/**
 * Update a poll item
 */
export async function updatePollItem(itemId: number, data: Partial<PollItemData>) {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) {
    fields.push('title = ?');
    values.push(data.title);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    values.push(data.description);
  }
  if (data.image_url !== undefined) {
    fields.push('image_url = ?');
    values.push(data.image_url);
  }
  if (data.display_order !== undefined) {
    fields.push('display_order = ?');
    values.push(data.display_order);
  }
  if (data.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(data.is_active ? 1 : 0);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  fields.push('updated_at = NOW()');
  values.push(itemId);

  await db.update(
    `UPDATE poll_items SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

/**
 * Delete a poll item
 */
export async function deletePollItem(itemId: number) {
  await db.delete(
    `DELETE FROM poll_items WHERE id = ?`,
    [itemId]
  );
}