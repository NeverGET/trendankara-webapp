import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';

export async function GET() {
  try {
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

      console.log('Radio fetch response status:', radioResponse.status);

      if (radioResponse.ok) {
        const radioData = await radioResponse.json();
        radioStats = {
          currentListeners: radioData.currentlisteners || 0,
          peakListeners: radioData.peaklisteners || 0,
          streamStatus: radioData.streamstatus === 1
        };
        console.log('Radio data fetched successfully:', radioStats);
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
      streamStatus: radioStats.streamStatus
    };

    return NextResponse.json({
      success: true,
      stats,
      radioStats,
      debug: {
        radioFetched: radioStats.currentListeners > 0 || radioStats.peakListeners > 0
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}