import { db } from '@/lib/db/client';
import { count } from '@/lib/db/queries';

/**
 * Dashboard Statistics Interface
 * Represents the data structure for admin dashboard metrics
 */
export interface DashboardStats {
  totalNews: number;
  totalPolls: number;
  activePolls: number;
  totalMedia: number;
  currentListeners: number;
  peakListeners: number;
  streamStatus: boolean;
}

/**
 * Get Dashboard Statistics
 *
 * Fetches all statistics needed for the admin dashboard:
 * - Database counts for news, polls, media
 * - Live radio stream statistics from external API
 *
 * @returns Promise<DashboardStats> Dashboard statistics object
 *
 * Note: This function handles errors gracefully and returns default values
 * if any query fails, ensuring the dashboard always renders.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Use existing query utilities for database counts
    // These queries run in parallel for better performance
    const [totalNews, totalPolls, activePolls, totalMedia] = await Promise.all([
      count('news'),
      count('polls'),
      count('polls', [{ column: 'is_active', operator: '=', value: 1 }]),
      count('media')
    ]);

    // Fetch radio statistics from external streaming API
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
        cache: 'no-store',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (radioResponse.ok) {
        const radioData = await radioResponse.json();
        radioStats = {
          currentListeners: radioData.currentlisteners || 0,
          peakListeners: radioData.peaklisteners || 0,
          streamStatus: radioData.streamstatus === 1
        };
      }
    } catch (radioError) {
      console.error('Failed to fetch radio stats:', radioError);
      // Continue with default values - don't fail entire dashboard
    }

    return {
      totalNews,
      totalPolls,
      activePolls,
      totalMedia,
      ...radioStats
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return empty stats on error to prevent page crash
    return {
      totalNews: 0,
      totalPolls: 0,
      activePolls: 0,
      totalMedia: 0,
      currentListeners: 0,
      peakListeners: 0,
      streamStatus: false
    };
  }
}
