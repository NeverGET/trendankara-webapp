import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch statistics from database
    const newsResult = await db.query(
      'SELECT COUNT(*) as count FROM news WHERE deleted_at IS NULL'
    );

    const pollsResult = await db.query(
      'SELECT COUNT(*) as count FROM polls WHERE deleted_at IS NULL'
    );

    const activePollsResult = await db.query(
      'SELECT COUNT(*) as count FROM polls WHERE is_active = 1 AND deleted_at IS NULL'
    );

    const mediaResult = await db.query(
      'SELECT COUNT(*) as count FROM media WHERE deleted_at IS NULL'
    );

    // Format the response
    const stats = {
      totalNews: newsResult.rows[0]?.count || 0,
      totalPolls: pollsResult.rows[0]?.count || 0,
      activePolls: activePollsResult.rows[0]?.count || 0,
      totalMedia: mediaResult.rows[0]?.count || 0,
      recentActivity: [],
      storageUsed: 0,
      lastBackup: null
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}