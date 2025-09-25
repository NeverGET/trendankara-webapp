import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';
import { RowDataPacket } from 'mysql2';

interface MediaItem extends RowDataPacket {
  id: number;
  filename: string;
  mime_type: string;
  size: number;
  url: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  usage_count?: number;
}

/**
 * GET /api/admin/media
 * Fetch media items with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '24');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all';
    const sort = searchParams.get('sort') || 'newest';
    const orphaned = searchParams.get('orphaned') === 'true';

    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions: string[] = ['deleted_at IS NULL'];
    const params: any[] = [];

    // Add search condition
    if (search) {
      conditions.push('filename LIKE ?');
      params.push(`%${search}%`);
    }

    // Add type filter
    if (type !== 'all') {
      switch (type) {
        case 'image':
          conditions.push('mime_type LIKE ?');
          params.push('image/%');
          break;
        case 'audio':
          conditions.push('mime_type LIKE ?');
          params.push('audio/%');
          break;
        case 'video':
          conditions.push('mime_type LIKE ?');
          params.push('video/%');
          break;
      }
    }

    // Add orphaned filter (if implemented with usage tracking)
    if (orphaned) {
      // This would require a usage tracking table or field
      // For now, we'll skip this filter
    }

    // Build order clause
    let orderBy = 'created_at DESC';
    switch (sort) {
      case 'oldest':
        orderBy = 'created_at ASC';
        break;
      case 'name':
        orderBy = 'filename ASC';
        break;
      case 'size':
        orderBy = 'size DESC';
        break;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM media
      WHERE ${conditions.join(' AND ')}
    `;

    const countResultParams = [...params];
    const countQueryResult = await db.query<RowDataPacket>(countQuery, countResultParams);
    const total = countQueryResult.rows[0].total;

    // Get media items
    // Note: Using direct interpolation for LIMIT/OFFSET due to mysql2 execute limitations
    const selectQuery = `
      SELECT *
      FROM media
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const mediaResult = await db.query<MediaItem>(selectQuery, params);
    const media = mediaResult.rows;

    // Transform data to match frontend expectations
    const transformedMedia = media.map(item => ({
      id: item.id.toString(),
      filename: item.filename,
      url: item.url,
      thumbnailUrl: item.thumbnail_url,
      thumbnails: item.thumbnails ? JSON.parse(item.thumbnails as any) : undefined,
      size: item.size,
      mimeType: item.mime_type,
      width: item.width,
      height: item.height,
      uploadedAt: item.created_at,
      title: item.original_name,
      alt_text: item.alt_text,
      usageCount: item.usage_count || 0
    }));

    return NextResponse.json({
      success: true,
      data: transformedMedia,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/media
 * Delete media files
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get IDs from request body
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'No media IDs provided' },
        { status: 400 }
      );
    }

    // Delete from database
    const placeholders = ids.map(() => '?').join(',');
    const deleteQuery = `
      UPDATE media
      SET deleted_at = NOW()
      WHERE id IN (${placeholders})
    `;

    await db.query(deleteQuery, ids);

    return NextResponse.json({
      success: true,
      message: `${ids.length} media files deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}