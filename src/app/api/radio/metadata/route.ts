import { NextResponse } from 'next/server';
import { getRadioNowPlaying, toDisplayText } from '@/lib/utils/radioNowPlaying';

/**
 * GET /api/radio/metadata
 *
 * Contract (unchanged): `{ currentSong, currentListeners, bitrate, serverTitle,
 * timestamp }`. Extra fields below are additive.
 *
 * Provider selection (AzuraCast vs Shoutcast) happens in
 * `@/lib/utils/radioNowPlaying`, driven by the resolved radio configuration.
 * Always answers 200 so the admin dashboard never has to special-case an error.
 */
export async function GET() {
  const result = await getRadioNowPlaying();

  return NextResponse.json(
    {
      // --- existing contract ---
      currentSong: toDisplayText(result),
      currentListeners: result.data.currentListeners,
      bitrate: result.data.bitrate,
      serverTitle: result.data.serverTitle,
      timestamp: new Date().toISOString(),

      // --- additive ---
      artist: result.data.artist,
      title: result.data.title,
      art: result.data.art,
      uniqueListeners: result.data.uniqueListeners,
      playingNext: result.data.playingNext,
      songHistory: result.data.songHistory,
      isOnline: result.data.streamStatus,
      provider: result.provider,
      source: result.endpointKind,
      ...(result.success ? {} : { error: result.error || 'Failed to fetch metadata' }),
    },
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}
