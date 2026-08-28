/**
 * Radio History API Route
 * GET /api/mobile/v1/radio/history
 * Returns recently played songs
 *
 * Backed by the live station when the configured provider can supply history
 * (AzuraCast exposes `song_history` on its now-playing payload, including
 * `played_at` and `duration`). Turkish mojibake is repaired on the way through
 * by the shared normalizer.
 *
 * Contract is unchanged — the same `{ songs: [...], total }` shape the
 * already-published app parses. When the upstream has no history to give
 * (Shoutcast, or an unreachable server) the previous placeholder list is served
 * instead, so the app never renders an empty screen and never sees an error.
 */

import { NextRequest, NextResponse } from 'next/server';
import { MobileApiResponse } from '@/types/mobile';
import { getRadioNowPlaying } from '@/lib/utils/radioNowPlaying';

interface HistorySong {
  title: string;
  artist: string;
  album: string;
  artwork: string;
  playedAt: string;
  duration: number;
}

/**
 * Shown only when the station reports no history at all. Kept from the original
 * implementation so the app's list view behaves exactly as it does today.
 */
const PLACEHOLDER_SONGS: HistorySong[] = [
  {
    title: 'Bir Derdim Var',
    artist: 'Mor ve Ötesi',
    album: 'Dünya Yalan Söylüyor',
    artwork: '/api/media/artwork/morveotesi.jpg',
    playedAt: new Date(Date.now() - 5 * 60000).toISOString(),
    duration: 245
  },
  {
    title: 'Gidersen',
    artist: 'Duman',
    album: 'Belki Alışman Lazım',
    artwork: '/api/media/artwork/duman.jpg',
    playedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    duration: 198
  },
  {
    title: 'Yalnızlık',
    artist: 'Teoman',
    album: 'En Güzel Hikayem',
    artwork: '/api/media/artwork/teoman.jpg',
    playedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    duration: 267
  },
  {
    title: 'Sevdim Seni Bir Kere',
    artist: 'Cem Adrian',
    album: 'Essentials',
    artwork: '/api/media/artwork/cemadrian.jpg',
    playedAt: new Date(Date.now() - 20 * 60000).toISOString(),
    duration: 312
  },
  {
    title: 'Bu Şehir Girdap Gülüm',
    artist: 'Adamlar',
    album: 'Aya Benzer',
    artwork: '/api/media/artwork/adamlar.jpg',
    playedAt: new Date(Date.now() - 25 * 60000).toISOString(),
    duration: 195
  }
];

/** Read live history; `[]` whenever the provider cannot supply any. */
async function getLiveHistory(): Promise<HistorySong[]> {
  try {
    const result = await getRadioNowPlaying();
    const entries = result.data.songHistoryEntries ?? [];

    return entries
      .filter((entry) => entry.title || entry.artist)
      .map((entry) => ({
        title: entry.title ?? entry.artist ?? '',
        artist: entry.artist ?? '',
        album: entry.album ?? '',
        artwork: entry.art ?? '',
        playedAt: entry.playedAt ?? new Date().toISOString(),
        duration: entry.duration
      }));
  } catch (error) {
    console.error('[mobile/radio/history] live history unavailable:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    const live = await getLiveHistory();
    const songs = (live.length > 0 ? live : PLACEHOLDER_SONGS).slice(0, limit);

    const history = {
      songs,
      // Preserved from the original implementation: the app reads `total` as
      // the length of the returned page.
      total: songs.length,
      source: live.length > 0 ? 'live' : 'placeholder'
    };

    const response: MobileApiResponse<any> = {
      success: true,
      data: history,
      cache: {
        etag: `"history-${Date.now()}"`,
        maxAge: 60 // 1 minute
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: 'Çalma geçmişi alınamadı'
      },
      { status: 500 }
    );
  }
}
