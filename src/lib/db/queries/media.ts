import { RowDataPacket } from 'mysql2/promise';
import {
  MediaEntity,
  InsertResult,
  UpdateResult,
  PaginationParams,
  PaginatedResult
} from '@/types/database';
import {
  findById,
  findAll,
  insert,
  updateById,
  softDeleteById,
  hardDeleteById,
  restoreById,
  count,
  exists,
  findBySearch,
  getPaginationParams
} from './index';

/**
 * Media Database Queries
 * Specialized database operations for media records
 * Includes soft delete support and file metadata handling
 */

/**
 * Create a new media record with file metadata
 */
export async function createMedia(data: {
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  thumbnails?: Record<string, string> | null;
  width?: number | null;
  height?: number | null;
  uploaded_by?: number | null;
}): Promise<InsertResult> {
  const mediaData = {
    ...data,
    thumbnails: data.thumbnails ? JSON.stringify(data.thumbnails) : null
  };

  return await insert<MediaEntity>('media', mediaData);
}

/**
 * Get a single media record by ID
 */
export async function getMedia(id: number): Promise<MediaEntity | null> {
  const media = await findById<MediaEntity>('media', id);

  if (media && media.thumbnails) {
    try {
      // Parse JSON thumbnails if stored as string
      if (typeof media.thumbnails === 'string') {
        media.thumbnails = JSON.parse(media.thumbnails);
      }
    } catch (error) {
      // If JSON parsing fails, set to null
      media.thumbnails = null;
    }
  }

  return media;
}

/**
 * Get multiple media records with pagination and filtering
 */
export async function getMediaList(options: {
  page?: number;
  limit?: number;
  mimeType?: string;
  uploadedBy?: number;
  search?: string;
  orderBy?: 'created_at' | 'original_name' | 'size';
  orderDirection?: 'ASC' | 'DESC';
  includeSoftDeleted?: boolean;
} = {}): Promise<PaginatedResult<MediaEntity>> {
  const {
    page = 1,
    limit = 20,
    mimeType,
    uploadedBy,
    search,
    orderBy = 'created_at',
    orderDirection = 'DESC',
    includeSoftDeleted = false
  } = options;

  const pagination = getPaginationParams(page, limit);
  const whereConditions: { column: string; operator: string; value: any }[] = [];

  // Filter by MIME type
  if (mimeType) {
    whereConditions.push({ column: 'mime_type', operator: '=', value: mimeType });
  }

  // Filter by uploader
  if (uploadedBy) {
    whereConditions.push({ column: 'uploaded_by', operator: '=', value: uploadedBy });
  }

  // Search in original filename
  if (search) {
    whereConditions.push({ column: 'original_name', operator: 'LIKE', value: `%${search}%` });
  }

  const result = await findAll<MediaEntity>('media', {
    where: whereConditions,
    orderBy: [{ column: orderBy, direction: orderDirection }],
    pagination,
    includeSoftDeleted
  }) as PaginatedResult<MediaEntity>;

  // Parse JSON thumbnails for all records
  if (result.data) {
    result.data.forEach(media => {
      if (media.thumbnails && typeof media.thumbnails === 'string') {
        try {
          media.thumbnails = JSON.parse(media.thumbnails);
        } catch {
          media.thumbnails = null;
        }
      }
    });
  }

  return result;
}

/**
 * Update media metadata
 */
export async function updateMedia(
  id: number,
  data: Partial<{
    original_name: string;
    thumbnails: Record<string, string> | null;
    width: number | null;
    height: number | null;
  }>
): Promise<UpdateResult> {
  const updateData = {
    ...data,
    thumbnails: data.thumbnails ? JSON.stringify(data.thumbnails) : null
  };

  return await updateById<MediaEntity>('media', id, updateData);
}

/**
 * Soft delete a media record (preserves file reference)
 */
export async function deleteMedia(id: number): Promise<UpdateResult> {
  return await softDeleteById('media', id);
}

/**
 * Hard delete a media record (permanent removal)
 */
export async function permanentDeleteMedia(id: number): Promise<UpdateResult> {
  return await hardDeleteById('media', id);
}

/**
 * Restore a soft-deleted media record
 */
export async function restoreMedia(id: number): Promise<UpdateResult> {
  return await restoreById('media', id);
}

/**
 * Get media statistics
 */
export async function getMediaStats(): Promise<{
  totalFiles: number;
  totalSize: number;
  byMimeType: { mime_type: string; count: number; total_size: number }[];
  recentUploads: number; // Last 24 hours
}> {
  // Total files and size
  const totalResult = await count('media');
  const sizeResult = await import('../client').then(({ db }) =>
    db.query<{ total_size: number | null } & RowDataPacket>(
      'SELECT SUM(size) as total_size FROM media WHERE deleted_at IS NULL'
    )
  );

  // By MIME type
  const mimeTypeResult = await import('../client').then(({ db }) =>
    db.query<{ mime_type: string; count: number; total_size: number } & RowDataPacket>(
      `SELECT
         mime_type,
         COUNT(*) as count,
         SUM(size) as total_size
       FROM media
       WHERE deleted_at IS NULL
       GROUP BY mime_type
       ORDER BY count DESC`
    )
  );

  // Recent uploads (last 24 hours)
  const recentResult = await count('media', [
    { column: 'created_at', operator: '>=', value: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  ]);

  return {
    totalFiles: totalResult,
    totalSize: sizeResult.rows[0]?.total_size || 0,
    byMimeType: mimeTypeResult.rows || [],
    recentUploads: recentResult
  };
}

/**
 * Find media by filename pattern
 */
export async function findMediaByFilename(
  pattern: string,
  options: {
    exactMatch?: boolean;
    pagination?: PaginationParams;
  } = {}
): Promise<PaginatedResult<MediaEntity> | MediaEntity[]> {
  const { exactMatch = false, pagination } = options;

  return await findBySearch<MediaEntity>('media', 'filename', pattern, {
    exactMatch,
    pagination,
    orderBy: [{ column: 'created_at', direction: 'DESC' }]
  });
}

/**
 * Find media by original name pattern
 */
export async function findMediaByOriginalName(
  pattern: string,
  options: {
    exactMatch?: boolean;
    pagination?: PaginationParams;
  } = {}
): Promise<PaginatedResult<MediaEntity> | MediaEntity[]> {
  const { exactMatch = false, pagination } = options;

  return await findBySearch<MediaEntity>('media', 'original_name', pattern, {
    exactMatch,
    pagination,
    orderBy: [{ column: 'created_at', direction: 'DESC' }]
  });
}

/**
 * Get media by MIME type category
 */
export async function getMediaByType(
  type: 'image' | 'video' | 'audio' | 'document',
  options: {
    pagination?: PaginationParams;
    uploadedBy?: number;
  } = {}
): Promise<PaginatedResult<MediaEntity> | MediaEntity[]> {
  const { pagination, uploadedBy } = options;

  let mimePattern: string;
  switch (type) {
    case 'image':
      mimePattern = 'image/%';
      break;
    case 'video':
      mimePattern = 'video/%';
      break;
    case 'audio':
      mimePattern = 'audio/%';
      break;
    case 'document':
      mimePattern = 'application/%';
      break;
    default:
      throw new Error(`Unsupported media type: ${type}`);
  }

  const whereConditions: { column: string; operator: string; value: any }[] = [
    { column: 'mime_type', operator: 'LIKE', value: mimePattern }
  ];

  if (uploadedBy) {
    whereConditions.push({ column: 'uploaded_by', operator: '=', value: uploadedBy });
  }

  const result = await findAll<MediaEntity>('media', {
    where: whereConditions,
    orderBy: [{ column: 'created_at', direction: 'DESC' }],
    pagination
  });

  // Parse JSON thumbnails for all records
  const parseResult = (data: MediaEntity[]) => {
    return data.map(media => {
      if (media.thumbnails && typeof media.thumbnails === 'string') {
        try {
          media.thumbnails = JSON.parse(media.thumbnails);
        } catch {
          media.thumbnails = null;
        }
      }
      return media;
    });
  };

  if (Array.isArray(result)) {
    return parseResult(result);
  } else {
    return {
      ...result,
      data: parseResult(result.data)
    };
  }
}

/**
 * Get orphaned media (files not referenced by any content)
 * This would need to be extended based on actual usage tracking
 */
export async function getOrphanedMedia(
  pagination?: PaginationParams
): Promise<PaginatedResult<MediaEntity> | MediaEntity[]> {
  // For now, just return media older than 30 days with no recent access
  // This would be enhanced with actual reference tracking in production
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  return await findAll<MediaEntity>('media', {
    where: [
      { column: 'created_at', operator: '<', value: thirtyDaysAgo }
    ],
    orderBy: [{ column: 'created_at', direction: 'ASC' }],
    pagination
  });
}

/**
 * Check if media file exists
 */
export async function mediaExists(filename: string): Promise<boolean> {
  return await exists('media', [
    { column: 'filename', operator: '=', value: filename }
  ]);
}

/**
 * Get media upload history for a user
 */
export async function getUserMediaHistory(
  userId: number,
  pagination?: PaginationParams
): Promise<PaginatedResult<MediaEntity> | MediaEntity[]> {
  const result = await findAll<MediaEntity>('media', {
    where: [
      { column: 'uploaded_by', operator: '=', value: userId }
    ],
    orderBy: [{ column: 'created_at', direction: 'DESC' }],
    pagination
  });

  // Parse JSON thumbnails for all records
  const parseResult = (data: MediaEntity[]) => {
    return data.map(media => {
      if (media.thumbnails && typeof media.thumbnails === 'string') {
        try {
          media.thumbnails = JSON.parse(media.thumbnails);
        } catch {
          media.thumbnails = null;
        }
      }
      return media;
    });
  };

  if (Array.isArray(result)) {
    return parseResult(result);
  } else {
    return {
      ...result,
      data: parseResult(result.data)
    };
  }
}

/**
 * Clean up soft-deleted media older than specified days
 */
export async function cleanupDeletedMedia(olderThanDays: number = 30): Promise<UpdateResult> {
  const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

  const { db } = await import('../client');
  return await db.delete(
    'DELETE FROM media WHERE deleted_at IS NOT NULL AND deleted_at < ?',
    [cutoffDate]
  );
}