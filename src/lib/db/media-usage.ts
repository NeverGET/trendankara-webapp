/**
 * Media usage checker
 * Check if media is referenced in news, polls, or content
 */

import { db } from './client';
import { RowDataPacket } from 'mysql2';

export interface MediaUsage {
  type: 'news' | 'poll' | 'content' | 'user';
  entityId: number;
  entityTitle: string;
  field: string;
  usageCount: number;
}

export interface MediaUsageResult {
  isUsed: boolean;
  totalUsages: number;
  usages: MediaUsage[];
  canDelete: boolean;
}

/**
 * Check if a media URL is used anywhere in the system
 */
export async function checkMediaUsage(mediaUrl: string): Promise<MediaUsageResult> {
  const usages: MediaUsage[] = [];

  // Check in news featured images
  const newsResult = await db.query<RowDataPacket>(
    `SELECT id, title FROM news
     WHERE featured_image = ? AND deleted_at IS NULL`,
    [mediaUrl]
  );

  if (newsResult.rows.length > 0) {
    newsResult.rows.forEach(row => {
      usages.push({
        type: 'news',
        entityId: row.id,
        entityTitle: row.title,
        field: 'featured_image',
        usageCount: 1
      });
    });
  }

  // Check in news content (for embedded images)
  const newsContentResult = await db.query<RowDataPacket>(
    `SELECT id, title FROM news
     WHERE content LIKE ? AND deleted_at IS NULL`,
    [`%${mediaUrl}%`]
  );

  if (newsContentResult.rows.length > 0) {
    newsContentResult.rows.forEach(row => {
      usages.push({
        type: 'news',
        entityId: row.id,
        entityTitle: row.title,
        field: 'content',
        usageCount: 1
      });
    });
  }

  // Check in poll items
  const pollItemsResult = await db.query<RowDataPacket>(
    `SELECT pi.id, pi.title, p.title as poll_title, p.id as poll_id
     FROM poll_items pi
     JOIN polls p ON pi.poll_id = p.id
     WHERE pi.image_url = ? AND p.deleted_at IS NULL`,
    [mediaUrl]
  );

  if (pollItemsResult.rows.length > 0) {
    pollItemsResult.rows.forEach(row => {
      usages.push({
        type: 'poll',
        entityId: row.poll_id,
        entityTitle: row.poll_title,
        field: 'poll_item_image',
        usageCount: 1
      });
    });
  }

  // Check in content pages (JSON fields)
  const contentResult = await db.query<RowDataPacket>(
    `SELECT id, title FROM content_pages
     WHERE JSON_CONTAINS(components, ?, '$')
     AND deleted_at IS NULL`,
    [JSON.stringify(mediaUrl)]
  );

  if (contentResult.rows.length > 0) {
    contentResult.rows.forEach(row => {
      usages.push({
        type: 'content',
        entityId: row.id,
        entityTitle: row.title,
        field: 'components',
        usageCount: 1
      });
    });
  }

  // Check in user avatars
  const userResult = await db.query<RowDataPacket>(
    `SELECT id, name FROM users
     WHERE avatar_url = ?`,
    [mediaUrl]
  );

  if (userResult.rows.length > 0) {
    userResult.rows.forEach(row => {
      usages.push({
        type: 'user',
        entityId: row.id,
        entityTitle: row.name,
        field: 'avatar_url',
        usageCount: 1
      });
    });
  }

  const totalUsages = usages.length;
  const isUsed = totalUsages > 0;

  return {
    isUsed,
    totalUsages,
    usages,
    canDelete: !isUsed
  };
}

/**
 * Check multiple media URLs for usage
 */
export async function checkMultipleMediaUsage(
  mediaUrls: string[]
): Promise<Map<string, MediaUsageResult>> {
  const results = new Map<string, MediaUsageResult>();

  for (const url of mediaUrls) {
    const usage = await checkMediaUsage(url);
    results.set(url, usage);
  }

  return results;
}

/**
 * Get orphaned media (not used anywhere)
 */
export async function getOrphanedMedia(limit: number = 100): Promise<{
  id: number;
  url: string;
  filename: string;
  size: number;
  created_at: Date;
}[]> {
  // First get all media
  const mediaResult = await db.query<RowDataPacket>(
    `SELECT id, url, filename, size, created_at FROM media
     ORDER BY created_at DESC
     LIMIT ?`,
    [limit]
  );

  const orphaned: any[] = [];

  for (const media of mediaResult.rows) {
    const usage = await checkMediaUsage(media.url);
    if (!usage.isUsed) {
      orphaned.push({
        id: media.id,
        url: media.url,
        filename: media.filename,
        size: media.size,
        created_at: media.created_at
      });
    }
  }

  return orphaned;
}

/**
 * Replace media URL in all occurrences
 */
export async function replaceMediaUrl(
  oldUrl: string,
  newUrl: string
): Promise<{
  success: boolean;
  replacements: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let replacements = 0;

  try {
    // Replace in news featured images
    const newsImageResult = await db.update(
      `UPDATE news SET featured_image = ?
       WHERE featured_image = ? AND deleted_at IS NULL`,
      [newUrl, oldUrl]
    );
    replacements += newsImageResult.affectedRows || 0;

    // Replace in news content
    const newsContentResult = await db.update(
      `UPDATE news SET content = REPLACE(content, ?, ?)
       WHERE content LIKE ? AND deleted_at IS NULL`,
      [oldUrl, newUrl, `%${oldUrl}%`]
    );
    replacements += newsContentResult.affectedRows || 0;

    // Replace in poll items
    const pollItemsResult = await db.update(
      `UPDATE poll_items pi
       JOIN polls p ON pi.poll_id = p.id
       SET pi.image_url = ?
       WHERE pi.image_url = ? AND p.deleted_at IS NULL`,
      [newUrl, oldUrl]
    );
    replacements += pollItemsResult.affectedRows || 0;

    // Replace in user avatars
    const userResult = await db.update(
      `UPDATE users SET avatar_url = ?
       WHERE avatar_url = ?`,
      [newUrl, oldUrl]
    );
    replacements += userResult.affectedRows || 0;

    // Note: Replacing in JSON fields requires more complex logic
    // and might need to be done programmatically

  } catch (error) {
    console.error('Error replacing media URL:', error);
    errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return {
    success: errors.length === 0,
    replacements,
    errors
  };
}

/**
 * Get media usage statistics
 */
export async function getMediaUsageStats(): Promise<{
  totalMedia: number;
  usedMedia: number;
  orphanedMedia: number;
  totalSize: number;
  orphanedSize: number;
}> {
  // Get total media count and size
  const totalResult = await db.query<RowDataPacket>(
    `SELECT COUNT(*) as count, SUM(size) as total_size FROM media`
  );
  const totalMedia = totalResult.rows[0].count || 0;
  const totalSize = totalResult.rows[0].total_size || 0;

  // Get orphaned media
  const orphaned = await getOrphanedMedia(1000);
  const orphanedMedia = orphaned.length;
  const orphanedSize = orphaned.reduce((sum, media) => sum + media.size, 0);

  return {
    totalMedia,
    usedMedia: totalMedia - orphanedMedia,
    orphanedMedia,
    totalSize,
    orphanedSize
  };
}

/**
 * Clean up orphaned media
 */
export async function cleanupOrphanedMedia(
  options: {
    dryRun?: boolean;
    olderThanDays?: number;
    limit?: number;
  } = {}
): Promise<{
  deleted: number;
  freedSpace: number;
  errors: string[];
}> {
  const { dryRun = true, olderThanDays = 30, limit = 100 } = options;

  const errors: string[] = [];
  let deleted = 0;
  let freedSpace = 0;

  try {
    // Get orphaned media older than specified days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const orphanedResult = await db.query<RowDataPacket>(
      `SELECT id, url, filename, size FROM media
       WHERE created_at < ?
       ORDER BY created_at ASC
       LIMIT ?`,
      [cutoffDate, limit]
    );

    for (const media of orphanedResult.rows) {
      const usage = await checkMediaUsage(media.url);

      if (!usage.isUsed) {
        if (!dryRun) {
          // Delete from database
          await db.delete(
            `DELETE FROM media WHERE id = ?`,
            [media.id]
          );

          // TODO: Also delete from MinIO storage
          // await storageClient.deleteFile(media.url);
        }

        deleted++;
        freedSpace += media.size || 0;
      }
    }
  } catch (error) {
    console.error('Error cleaning up orphaned media:', error);
    errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return {
    deleted,
    freedSpace,
    errors
  };
}

/**
 * Find duplicate media by hash or filename
 */
export async function findDuplicateMedia(): Promise<{
  duplicates: Array<{
    hash: string;
    files: Array<{
      id: number;
      url: string;
      filename: string;
      size: number;
    }>;
  }>;
  totalDuplicates: number;
  wastedSpace: number;
}> {
  // Group by file hash if available, otherwise by filename and size
  const result = await db.query<RowDataPacket>(
    `SELECT
      COALESCE(file_hash, CONCAT(filename, '_', size)) as hash,
      COUNT(*) as count,
      SUM(size) as total_size,
      GROUP_CONCAT(id) as ids,
      GROUP_CONCAT(url) as urls,
      GROUP_CONCAT(filename) as filenames
     FROM media
     GROUP BY hash
     HAVING count > 1`
  );

  const duplicates: any[] = [];
  let totalDuplicates = 0;
  let wastedSpace = 0;

  for (const row of result.rows) {
    const ids = row.ids.split(',');
    const urls = row.urls.split(',');
    const filenames = row.filenames.split(',');

    const files = ids.map((id: string, index: number) => ({
      id: parseInt(id),
      url: urls[index],
      filename: filenames[index],
      size: row.total_size / row.count
    }));

    duplicates.push({
      hash: row.hash,
      files
    });

    totalDuplicates += row.count - 1;
    wastedSpace += row.total_size - (row.total_size / row.count);
  }

  return {
    duplicates,
    totalDuplicates,
    wastedSpace
  };
}