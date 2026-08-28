import { NextResponse } from 'next/server';
import { getRadioNowPlaying, toDisplayText } from '@/lib/utils/radioNowPlaying';

/**
 * GET /api/radio/nowplaying
 *
 * Contract (unchanged): `{ nowPlaying: string }` — RadioPlayerContext polls this
 * every 10 seconds and reads `nowPlaying` only. Extra fields below are additive.
 *
 * This proxy NEVER fails: a fetch error, a bad payload, an offline station or a
 * "Station Offline" track all resolve to Turkish placeholder copy with HTTP 200,
 * so the client needs no error UI.
 */
export async function GET() {
  const result = await getRadioNowPlaying();

  return NextResponse.json(
    {
      // --- existing contract ---
      nowPlaying: toDisplayText(result),

      // --- additive ---
      artist: result.data.artist,
      title: result.data.title,
      art: result.data.art,
      playingNext: result.data.playingNext,
      songHistory: result.data.songHistory,
      duration: result.data.duration,
      elapsed: result.data.elapsed,
      isOnline: result.data.streamStatus,
      provider: result.provider,
      source: result.endpointKind,
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
