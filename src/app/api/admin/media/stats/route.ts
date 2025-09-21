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
    const [totalResult] = await db.execute(
      'SELECT COUNT(*) as total FROM media'
    ) as [RowDataPacket[], any];

    // Get total size
    const [sizeResult] = await db.execute(
      'SELECT COALESCE(SUM(size), 0) as totalSize FROM media'
    ) as [RowDataPacket[], any];

    // Get count by type
    const [typeStats] = await db.execute(`
      SELECT
        CASE
          WHEN mime_type LIKE 'image/%' THEN 'images'
          WHEN mime_type LIKE 'audio/%' THEN 'audio'
          WHEN mime_type LIKE 'video/%' THEN 'videos'
          ELSE 'other'
        END as type,
        COUNT(*) as count
      FROM media
      GROUP BY type
    `) as [RowDataPacket[], any];

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

    // Transform to match frontend expectations
    return NextResponse.json({
      success: true,
      data: {
        totalFiles: parseInt(stats.total as any) || 0,
        totalSize: parseInt(stats.totalSize as any) || 0,
        usedSpace: parseInt(stats.totalSize as any) || 0,
        orphanedFiles: 0, // TODO: Implement orphaned files detection
        duplicates: 0 // TODO: Implement duplicate detection
      }
    });
  } catch (error) {
    console.error('Error fetching media stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media statistics' },
      { status: 500 }
    );
  }
}