import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';
import { RowDataPacket } from 'mysql2';

/**
 * GET /api/admin/media/stats
 * Get media statistics
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

    // Get total count
    const [totalResult] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM media'
    );

    // Get total size
    const [sizeResult] = await db.execute<RowDataPacket[]>(
      'SELECT COALESCE(SUM(size), 0) as totalSize FROM media'
    );

    // Get count by type
    const [typeStats] = await db.execute<RowDataPacket[]>(`
      SELECT
        CASE
          WHEN mimetype LIKE 'image/%' THEN 'images'
          WHEN mimetype LIKE 'audio/%' THEN 'audio'
          WHEN mimetype LIKE 'video/%' THEN 'videos'
          ELSE 'other'
        END as type,
        COUNT(*) as count
      FROM media
      GROUP BY type
    `);

    // Convert type stats to object
    const stats = {
      total: totalResult[0].total || 0,
      images: 0,
      videos: 0,
      audio: 0,
      totalSize: sizeResult[0].totalSize || 0
    };

    // Fill in type counts
    typeStats.forEach((row) => {
      if (row.type === 'images') stats.images = row.count;
      if (row.type === 'videos') stats.videos = row.count;
      if (row.type === 'audio') stats.audio = row.count;
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching media stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media statistics' },
      { status: 500 }
    );
  }
}