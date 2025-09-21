import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';
import { RowDataPacket } from 'mysql2';

/**
 * POST /api/admin/media/cleanup
 * Clean up orphaned media files
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find orphaned media (not referenced in news, polls, etc.)
    // This is a simplified version - you may need to check other tables
    const findOrphanedQuery = `
      SELECT m.id
      FROM media m
      LEFT JOIN news n ON (
        n.image_url LIKE CONCAT('%', m.filename, '%')
        OR n.content LIKE CONCAT('%', m.url, '%')
      )
      LEFT JOIN polls p ON (
        p.image_url LIKE CONCAT('%', m.filename, '%')
      )
      WHERE m.deleted_at IS NULL
        AND n.id IS NULL
        AND p.id IS NULL
    `;

    const orphanedResult = await db.query<RowDataPacket>(findOrphanedQuery);
    const orphanedIds = orphanedResult.rows.map((row: any) => row.id);

    if (orphanedIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No orphaned files found'
      });
    }

    // Mark orphaned files as deleted
    const placeholders = orphanedIds.map(() => '?').join(',');
    const deleteQuery = `
      UPDATE media
      SET deleted_at = NOW()
      WHERE id IN (${placeholders})
    `;

    await db.query(deleteQuery, orphanedIds);

    return NextResponse.json({
      success: true,
      message: `${orphanedIds.length} orphaned files cleaned up`
    });
  } catch (error) {
    console.error('Error cleaning up orphaned media:', error);
    return NextResponse.json(
      { error: 'Failed to clean up orphaned media' },
      { status: 500 }
    );
  }
}