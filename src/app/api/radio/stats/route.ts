import { NextResponse } from 'next/server';
import { getRadioEndpoints } from '@/lib/config/radio';
import {
  enrichWithLegacyCounters,
  getRadioNowPlaying,
  RADIO_FALLBACK_TEXT,
} from '@/lib/utils/radioNowPlaying';

interface RadioStats {
  currentListeners: number;
  peakListeners: number;
  maxListeners: number;
  uniqueListeners: number;
  averageTime: number;
  songTitle: string;
  streamStatus: boolean;
  streamUptime: number;
  bitrate: string;
}

/**
 * GET /api/radio/stats
 *
 * Contract (unchanged): `{ success: boolean, data: RadioStats }`, plus the
 * optional `source` marker the previous implementation emitted.
 *
 * Works against AzuraCast and Shoutcast; the provider is resolved from the
 * active radio configuration.
 */
export async function GET() {
  const endpoints = await getRadioEndpoints();
  const result = await getRadioNowPlaying(endpoints);

  // The AzuraCast now-playing API has no historical peak / cap / uptime, so top
  // those up from the legacy counters when the server still offers them.
  const data =
    result.success && result.provider === 'azuracast'
      ? await enrichWithLegacyCounters(endpoints, result.data)
      : result.data;

  const stats: RadioStats = {
    currentListeners: data.currentListeners,
    peakListeners: data.peakListeners,
    maxListeners: data.maxListeners,
    uniqueListeners: data.uniqueListeners,
    averageTime: data.averageTime,
    songTitle: data.currentSong || (result.success ? RADIO_FALLBACK_TEXT : 'Bilgi yok'),
    streamStatus: data.streamStatus,
    streamUptime: data.streamUptime,
    bitrate: data.bitrate,
  };

  if (!result.success) {
    return NextResponse.json({
      success: false,
      error: 'Radyo istatistikleri alınamadı',
      data: stats,
      provider: result.provider,
    });
  }

  return NextResponse.json({
    success: true,
    data: stats,
    provider: result.provider,
    source: result.endpointKind,
  });
}
