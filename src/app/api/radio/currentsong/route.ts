import { NextResponse } from 'next/server';
import { getRadioNowPlaying, toDisplayText, RADIO_FALLBACK_TEXT } from '@/lib/utils/radioNowPlaying';

/**
 * GET /api/radio/currentsong — Shoutcast-compatible plain text.
 *
 * WHY THIS EXISTS
 * ---------------
 * The published mobile app reads now-playing from `<stream>/currentsong`, the
 * bare-text endpoint Shoutcast exposes. AzuraCast has no such endpoint, so this
 * route reimplements the dialect on our own domain: paired with
 * `/api/radio/stream`, the app's `streamUrl.replace(/\/stream\/?$/, '/currentsong')`
 * lands here and keeps working with no app-store release.
 *
 * Body is exactly `Artist - Title` — no JSON, no quotes, no trailing newline —
 * because that is byte-for-byte what Shoutcast returns and what the app parses.
 *
 * Provider-independent: the normalized metadata layer picks AzuraCast or
 * Shoutcast from the active configuration, and applies the Windows-1254
 * Turkish mojibake repair on the way through.
 *
 * NEVER FAILS: any error resolves to HTTP 200 with `Radyo Çalıyor`, matching the
 * never-fail philosophy of the other /api/radio/* routes. An error status here
 * would show the user a broken player.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TEXT_HEADERS = {
  // charset=utf-8 is load-bearing: without it Turkish characters (İ Ğ Ş ı ç ö ü)
  // are decoded as Latin-1 by the client and the mojibake we just repaired
  // comes straight back.
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
} as const;

export async function GET() {
  let body = RADIO_FALLBACK_TEXT;

  try {
    const result = await getRadioNowPlaying();
    // toDisplayText already substitutes RADIO_FALLBACK_TEXT for an offline
    // station, a failed read, or a "Station Offline" pseudo-track.
    body = toDisplayText(result).trim() || RADIO_FALLBACK_TEXT;
  } catch (error) {
    console.error('[radio/currentsong] read failed, serving placeholder copy:', error);
  }

  return new NextResponse(body, { status: 200, headers: TEXT_HEADERS });
}
