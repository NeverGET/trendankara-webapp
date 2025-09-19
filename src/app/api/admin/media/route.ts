import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';
import { RowDataPacket } from 'mysql2';

interface MediaItem extends RowDataPacket {
  id: number;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  uploaded_by: number;
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
    const conditions: string[] = ['1=1'];
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
          conditions.push('mimetype LIKE ?');
          params.push('image/%');
          break;
        case 'audio':
          conditions.push('mimetype LIKE ?');
          params.push('audio/%');
          break;
        case 'video':
          conditions.push('mimetype LIKE ?');
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

    const [countResult] = await db.execute<RowDataPacket[]>(countQuery, params);
    const total = countResult[0].total;

    // Get media items
    const query = `
      SELECT *
      FROM media
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    const [media] = await db.execute<MediaItem[]>(query, params);

    return NextResponse.json({
      media,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
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