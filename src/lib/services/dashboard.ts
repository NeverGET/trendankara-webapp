import { db } from '@/lib/db/client';
import { count } from '@/lib/db/queries';
import { getRadioEndpoints } from '@/lib/config/radio';
import { enrichWithLegacyCounters, getRadioNowPlaying } from '@/lib/utils/radioNowPlaying';

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
      // Provider-aware (AzuraCast or Shoutcast) — resolved from radio_settings.
      const endpoints = await getRadioEndpoints();
      const result = await getRadioNowPlaying(endpoints);

      if (result.success) {
        const data =
          result.provider === 'azuracast'
            ? await enrichWithLegacyCounters(endpoints, result.data)
            : result.data;

        radioStats = {
          currentListeners: data.currentListeners,
          peakListeners: data.peakListeners,
          streamStatus: data.streamStatus
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
