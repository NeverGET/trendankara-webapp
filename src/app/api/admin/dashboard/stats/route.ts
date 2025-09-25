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

    // Fetch radio statistics
    let radioStats = {
      currentListeners: 0,
      peakListeners: 0,
      streamStatus: false
    };

    try {
      const radioResponse = await fetch('https://radyo.yayin.com.tr:5132/stats?json=1', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        cache: 'no-store'
      });

      if (radioResponse.ok) {
        const radioData = await radioResponse.json();
        radioStats = {
          currentListeners: radioData.currentlisteners || 0,
          peakListeners: radioData.peaklisteners || 0,
          streamStatus: radioData.streamstatus === 1
        };
        console.log('Radio stats fetched:', radioStats);
      } else {
        console.error('Radio response not ok:', radioResponse.status);
      }
    } catch (radioError) {
      console.error('Failed to fetch radio stats:', radioError);
    }

    // Format the response
    const stats = {
      totalNews: newsResult.rows[0]?.count || 0,
      totalPolls: pollsResult.rows[0]?.count || 0,
      activePolls: activePollsResult.rows[0]?.count || 0,
      totalMedia: mediaResult.rows[0]?.count || 0,
      currentListeners: radioStats.currentListeners,
      peakListeners: radioStats.peakListeners,
      streamStatus: radioStats.streamStatus,
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