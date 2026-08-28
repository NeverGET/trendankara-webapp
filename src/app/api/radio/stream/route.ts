import { NextResponse } from 'next/server';
import {
  getRadioConfig,
  isSelfReferentialRadioUrl,
  RADIO_DEFAULT_STREAM_URL,
} from '@/lib/config/radio';

/**
 * GET|HEAD /api/radio/stream — 302 to the real audio mount.
 *
 * WHY THIS EXISTS
 * ---------------
 * The published mobile app derives its metadata URL from its stream URL by
 * string surgery:
 *
 *   metadataUrl = streamUrl.replace(/\/stream\/?$/, '/currentsong')
 *
 * Publishing `https://trendankara.com/api/radio/stream` as the stream URL
 * therefore makes the app ask for `https://trendankara.com/api/radio/currentsong`
 * — an endpoint we own and can keep correct across provider migrations. That
 * removes the need for an app-store release when the upstream station moves.
 *
 * Because this sits on the audio hot path it does as little as possible: resolve
 * the configured stream URL (database -> env -> default, cached for 30s inside
 * `getRadioConfig`) and redirect. It never proxies bytes.
 *
 * `force-dynamic` is required: without it Next would prerender this handler at
 * build time and bake in whatever stream URL happened to be configured then.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const REDIRECT_HEADERS = {
  // Players and CDNs must never pin the redirect target — an admin can change
  // the stream URL at any moment.
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
} as const;

/**
 * Resolve the mount to redirect to. Never throws and never returns a
 * non-http(s) target, so a malformed `radio_settings` row degrades to the
 * built-in default instead of emitting a broken `Location`.
 */
async function resolveStreamTarget(): Promise<string> {
  let candidate: string = RADIO_DEFAULT_STREAM_URL;

  try {
    const config = await getRadioConfig();
    if (config.streamUrl) candidate = config.streamUrl;
  } catch (error) {
    console.error('[radio/stream] config resolution failed, using default mount:', error);
  }

  // An operator may well store THIS endpoint's own URL in `radio_settings` —
  // that is exactly what publishing `/api/radio/stream` to the mobile app
  // invites. Redirecting to ourselves would be an infinite loop, so fall back
  // to the configured upstream default instead.
  if (isSelfReferentialRadioUrl(candidate)) {
    console.warn('[radio/stream] configured stream URL points back at this route:', candidate);
    candidate = process.env.RADIO_STREAM_URL?.trim() || RADIO_DEFAULT_STREAM_URL;

    if (isSelfReferentialRadioUrl(candidate)) {
      candidate = RADIO_DEFAULT_STREAM_URL;
    }
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    console.warn('[radio/stream] configured stream URL is not http(s):', candidate);
  } catch {
    console.warn('[radio/stream] configured stream URL is unparseable:', candidate);
  }

  return RADIO_DEFAULT_STREAM_URL;
}

export async function GET() {
  const target = await resolveStreamTarget();

  // 302 (not 301/308): the target is configuration, not a permanent identity.
  return NextResponse.redirect(target, { status: 302, headers: REDIRECT_HEADERS });
}

/**
 * Players probe with HEAD before committing to a stream. Next would synthesise
 * a HEAD from GET, but declaring it explicitly keeps the behaviour obvious and
 * guarantees the same status/headers.
 */
export async function HEAD() {
  const target = await resolveStreamTarget();

  return new NextResponse(null, {
    status: 302,
    headers: { ...REDIRECT_HEADERS, Location: target },
  });
}
