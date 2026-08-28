import { NextResponse } from 'next/server';
import { getRadioEndpoints } from '@/lib/config/radio';
import { enrichWithLegacyCounters, getRadioNowPlaying } from '@/lib/utils/radioNowPlaying';

/**
 * GET /api/test/radio
 *
 * Diagnostic view of whatever the configured provider reports. Contract kept:
 * `{ success, raw, formatted }` — `raw` is now the normalized payload plus the
 * resolved endpoints, which is far more useful than the old Shoutcast blob.
 */
export async function GET() {
  try {
    const endpoints = await getRadioEndpoints();
    const result = await getRadioNowPlaying(endpoints);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Unknown error',
        provider: endpoints.provider,
        endpointTried: result.endpointUsed
      });
    }

    const data =
      result.provider === 'azuracast'
        ? await enrichWithLegacyCounters(endpoints, result.data)
        : result.data;

    return NextResponse.json({
      success: true,
      raw: {
        provider: result.provider,
        endpointUsed: result.endpointUsed,
        endpointKind: result.endpointKind,
        endpoints,
        normalized: data
      },
      formatted: {
        currentListeners: data.currentListeners,
        peakListeners: data.peakListeners,
        uniqueListeners: data.uniqueListeners,
        streamStatus: data.streamStatus,
        songTitle: data.currentSong || 'Bilgi yok',
        serverTitle: data.serverTitle || 'Radyo',
        bitrate: data.bitrate,
        uptime: data.streamUptime,
        uptimeFormatted: formatUptime(data.streamUptime)
      }
    });
  } catch (error) {
    console.error('Radio test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days} gün ${hours} saat`;
  } else if (hours > 0) {
    return `${hours} saat ${minutes} dakika`;
  } else {
    return `${minutes} dakika`;
  }
}
