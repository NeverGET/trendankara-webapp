/**
 * Provider-aware now-playing reader (SERVER ONLY).
 *
 * Resolves the configured provider from `@/lib/config/radio` and reads metadata
 * from whichever server is actually in front of us:
 *
 *   azuracast  -> `/api/nowplaying_static/<sc>.json`, then `/api/nowplaying/<sc>`
 *   shoutcast  -> `stats?sid=1` (XML), `stats?json=1`, `7.html`, `currentsong`
 *
 * Both paths return the same {@link NormalizedRadioMetadata}, so the public
 * `/api/radio/*` contracts do not depend on which server is configured.
 *
 * Nothing here throws. Every reader validates the *payload shape* rather than
 * trusting the status line, because AzuraCast answers unknown Shoutcast paths
 * with its own HTML/404 page and a stale proxy can answer anything with a 200.
 */

import { getRadioEndpoints } from '@/lib/config/radio';
import type { RadioEndpoints, RadioProvider } from '@/lib/config/radioDefaults';
import {
  fetchAzuracastNowPlayingWithFallback,
  splitArtistTitle,
  type NormalizedRadioMetadata,
} from '@/lib/utils/azuracast';
import { fixTurkishMojibake } from '@/lib/utils/turkishEncoding';

/**
 * Shown whenever the server reports nothing useful. The proxy never surfaces
 * an error to the player, it just shows Turkish placeholder copy.
 *
 * Declared in `radioDefaults` (isomorphic) and re-exported here so existing
 * server-side importers keep working unchanged.
 */
export { RADIO_FALLBACK_TEXT } from '@/lib/config/radioDefaults';
import { RADIO_FALLBACK_TEXT } from '@/lib/config/radioDefaults';

export interface RadioNowPlayingResult {
  success: boolean;
  provider: RadioProvider;
  data: NormalizedRadioMetadata;
  /** Which upstream URL produced the data. */
  endpointUsed?: string;
  /** `nowplaying_static` | `nowplaying` for AzuraCast; the reader name for Shoutcast. */
  endpointKind?: string;
  error?: string;
}

/** A zeroed result used whenever every upstream read fails. */
export function emptyRadioMetadata(provider: RadioProvider): NormalizedRadioMetadata {
  return {
    provider,
    currentSong: '',
    artist: null,
    title: null,
    album: null,
    art: null,
    currentListeners: 0,
    uniqueListeners: 0,
    peakListeners: 0,
    maxListeners: 0,
    averageTime: 0,
    bitrate: '128',
    serverTitle: 'Trend Ankara Radio',
    streamStatus: false,
    streamUptime: 0,
    playingNext: null,
    songHistory: [],
    duration: 0,
    elapsed: 0,
    listenUrl: null,
  };
}

const SHOUTCAST_TIMEOUT_MS = 5000;

async function fetchText(url: string, accept: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: accept,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(SHOUTCAST_TIMEOUT_MS),
    });

    // Status alone is not proof of anything; the caller shape-checks the body.
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function toInt(value: string | null | undefined, fallback = 0): number {
  const parsed = parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Repair encoding, trim, and drop empty strings. */
function clean(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const repaired = fixTurkishMojibake(value).trim();
  return repaired.length > 0 ? repaired : null;
}

function buildShoutcastMetadata(fields: {
  songTitle?: string | null;
  currentListeners?: number;
  peakListeners?: number;
  maxListeners?: number;
  uniqueListeners?: number;
  averageTime?: number;
  bitrate?: string | null;
  serverTitle?: string | null;
  streamStatus?: boolean;
  streamUptime?: number;
}): NormalizedRadioMetadata {
  const base = emptyRadioMetadata('shoutcast');
  const songTitle = clean(fields.songTitle);
  const { artist, title } = splitArtistTitle(songTitle);

  return {
    ...base,
    currentSong: songTitle ?? '',
    artist,
    title,
    currentListeners: fields.currentListeners ?? 0,
    peakListeners: fields.peakListeners ?? 0,
    maxListeners: fields.maxListeners ?? 0,
    uniqueListeners: fields.uniqueListeners ?? 0,
    averageTime: fields.averageTime ?? 0,
    bitrate: clean(fields.bitrate) ?? '128',
    serverTitle: clean(fields.serverTitle) ?? base.serverTitle,
    streamStatus: fields.streamStatus ?? Boolean(songTitle),
    streamUptime: fields.streamUptime ?? 0,
  };
}

/** `stats?sid=1` — Shoutcast XML. Requires the XML markers to be present. */
async function readShoutcastXml(
  endpoints: RadioEndpoints
): Promise<RadioNowPlayingResult | null> {
  const xml = await fetchText(endpoints.statsXmlUrl, 'application/xml, text/xml, */*');
  // Shape check: an AzuraCast HTML shell has no SHOUTCASTSERVER/SONGTITLE tags.
  if (!xml || !/<(SHOUTCASTSERVER|SONGTITLE)[\s>]/i.test(xml)) return null;

  const pick = (tag: string): string | null => {
    const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'));
    return match ? match[1] : null;
  };

  return {
    success: true,
    provider: 'shoutcast',
    endpointUsed: endpoints.statsXmlUrl,
    endpointKind: 'stats-xml',
    data: buildShoutcastMetadata({
      songTitle: pick('SONGTITLE'),
      currentListeners: toInt(pick('CURRENTLISTENERS')),
      peakListeners: toInt(pick('PEAKLISTENERS')),
      maxListeners: toInt(pick('MAXLISTENERS')),
      uniqueListeners: toInt(pick('UNIQUELISTENERS')),
      averageTime: toInt(pick('AVERAGETIME')),
      bitrate: pick('BITRATE'),
      serverTitle: pick('SERVERTITLE'),
      streamStatus: toInt(pick('STREAMSTATUS')) === 1,
      streamUptime: toInt(pick('STREAMUPTIME')),
    }),
  };
}

/** `stats?json=1` — Shoutcast JSON. Requires the canonical keys. */
async function readShoutcastJson(
  endpoints: RadioEndpoints
): Promise<RadioNowPlayingResult | null> {
  const body = await fetchText(endpoints.statsJsonUrl, 'application/json, */*');
  if (!body) return null;

  let data: Record<string, unknown>;
  try {
    const parsed = JSON.parse(body);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    data = parsed as Record<string, unknown>;
  } catch {
    return null;
  }

  // Shape check: a Shoutcast stats blob always carries these keys.
  if (!('currentlisteners' in data) && !('songtitle' in data)) return null;

  const str = (key: string): string | null =>
    typeof data[key] === 'string' ? (data[key] as string) : null;

  return {
    success: true,
    provider: 'shoutcast',
    endpointUsed: endpoints.statsJsonUrl,
    endpointKind: 'stats-json',
    data: buildShoutcastMetadata({
      songTitle: str('songtitle'),
      currentListeners: toInt(String(data.currentlisteners ?? '')),
      peakListeners: toInt(String(data.peaklisteners ?? '')),
      maxListeners: toInt(String(data.maxlisteners ?? '')),
      uniqueListeners: toInt(String(data.uniquelisteners ?? '')),
      averageTime: toInt(String(data.averagetime ?? '')),
      bitrate: str('bitrate') ?? String(data.bitrate ?? ''),
      serverTitle: str('servertitle'),
      streamStatus: toInt(String(data.streamstatus ?? '')) === 1,
      streamUptime: toInt(String(data.streamuptime ?? '')),
    }),
  };
}

/** `7.html` — legacy CSV inside a <body> tag. */
async function readShoutcastLegacy(
  endpoints: RadioEndpoints
): Promise<RadioNowPlayingResult | null> {
  const html = await fetchText(endpoints.legacyStatsUrl, 'text/html, text/plain, */*');
  if (!html) return null;

  const match = html.match(/<body>([^<]*)<\/body>/i);
  if (!match) return null;

  // Shape check: the legacy format is exactly 7 comma-separated fields.
  const parts = match[1].split(',');
  if (parts.length < 7) return null;

  return {
    success: true,
    provider: 'shoutcast',
    endpointUsed: endpoints.legacyStatsUrl,
    endpointKind: 'legacy-7html',
    data: buildShoutcastMetadata({
      // The song title itself may contain commas, so re-join the tail.
      songTitle: parts.slice(6).join(','),
      currentListeners: toInt(parts[0]),
      peakListeners: toInt(parts[2]),
      maxListeners: toInt(parts[3]),
      uniqueListeners: toInt(parts[4]),
      bitrate: parts[5],
      streamStatus: parts[1] === '1',
    }),
  };
}

/** `currentsong` — bare text, the last resort. */
async function readShoutcastCurrentSong(
  endpoints: RadioEndpoints
): Promise<RadioNowPlayingResult | null> {
  const text = await fetchText(endpoints.currentSongUrl, 'text/plain, */*');
  if (!text) return null;

  const trimmed = text.trim();
  // Shape check: reject an HTML app shell served with a 200.
  if (!trimmed || /^\s*<(!doctype|html|\?xml)/i.test(trimmed) || trimmed.length > 300) {
    return null;
  }

  return {
    success: true,
    provider: 'shoutcast',
    endpointUsed: endpoints.currentSongUrl,
    endpointKind: 'currentsong',
    data: buildShoutcastMetadata({ songTitle: trimmed, streamStatus: true }),
  };
}

/** Read metadata from a Shoutcast server, trying the richest source first. */
async function readShoutcast(endpoints: RadioEndpoints): Promise<RadioNowPlayingResult> {
  const readers = [
    readShoutcastXml,
    readShoutcastJson,
    readShoutcastLegacy,
    readShoutcastCurrentSong,
  ];

  for (const reader of readers) {
    const result = await reader(endpoints);
    if (result) return result;
  }

  return {
    success: false,
    provider: 'shoutcast',
    data: emptyRadioMetadata('shoutcast'),
    error: 'No Shoutcast endpoint returned a recognisable payload',
  };
}

/** Read metadata from an AzuraCast server (static file first, API second). */
async function readAzuracast(endpoints: RadioEndpoints): Promise<RadioNowPlayingResult> {
  const result = await fetchAzuracastNowPlayingWithFallback(endpoints.nowPlayingApiUrls, {
    timeout: SHOUTCAST_TIMEOUT_MS,
  });

  if (result.success && result.data) {
    if (result.attempts?.length) {
      console.warn(
        '[radio] AzuraCast static endpoint unavailable, fell back to the dynamic API:',
        result.attempts
      );
    }

    return {
      success: true,
      provider: 'azuracast',
      data: result.data,
      endpointUsed: result.endpointUsed,
      endpointKind: result.endpointKind,
    };
  }

  return {
    success: false,
    provider: 'azuracast',
    data: emptyRadioMetadata('azuracast'),
    endpointUsed: result.endpointUsed,
    endpointKind: result.endpointKind,
    error: result.error,
  };
}

/**
 * Read now-playing metadata from whichever provider is configured.
 * Never throws — on total failure it returns a zeroed payload with `success:false`.
 */
export async function getRadioNowPlaying(
  endpointsOverride?: RadioEndpoints
): Promise<RadioNowPlayingResult> {
  let endpoints: RadioEndpoints;

  try {
    endpoints = endpointsOverride ?? (await getRadioEndpoints());
  } catch (error) {
    console.error('[radio] failed to resolve endpoints:', error);
    return {
      success: false,
      provider: 'shoutcast',
      data: emptyRadioMetadata('shoutcast'),
      error: 'Radio configuration unavailable',
    };
  }

  try {
    return endpoints.provider === 'azuracast'
      ? await readAzuracast(endpoints)
      : await readShoutcast(endpoints);
  } catch (error) {
    console.error('[radio] now-playing read failed:', error);
    return {
      success: false,
      provider: endpoints.provider,
      data: emptyRadioMetadata(endpoints.provider),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Best-effort top-up for the counters AzuraCast's public now-playing API does
 * not expose (historical peak, listener cap, average session, uptime).
 *
 * Some AzuraCast installs — ours included — relay an upstream Shoutcast server
 * and therefore still answer `/<mount>/stats?json=1` with genuine Shoutcast
 * counters. Where that is not the case the call simply fails and the zeros
 * stand. It only ever fills fields that are still zero, and never touches the
 * song, listener count or station name, which the AzuraCast API owns.
 */
export async function enrichWithLegacyCounters(
  endpoints: RadioEndpoints,
  data: NormalizedRadioMetadata
): Promise<NormalizedRadioMetadata> {
  if (data.peakListeners > 0 && data.maxListeners > 0 && data.streamUptime > 0) {
    return data;
  }

  try {
    const legacy = (await readShoutcastJson(endpoints)) ?? (await readShoutcastXml(endpoints));
    if (!legacy) return data;

    return {
      ...data,
      peakListeners: data.peakListeners || legacy.data.peakListeners,
      maxListeners: data.maxListeners || legacy.data.maxListeners,
      averageTime: data.averageTime || legacy.data.averageTime,
      streamUptime: data.streamUptime || legacy.data.streamUptime,
    };
  } catch {
    return data;
  }
}

/**
 * The display string for the player: the current song, or Turkish placeholder
 * copy whenever the station is offline or reports nothing.
 */
export function toDisplayText(result: RadioNowPlayingResult): string {
  // AzuraCast reports `is_online:false` with a real-looking payload; the
  // normalizer also blanks a "Station Offline" title.
  if (!result.success) return RADIO_FALLBACK_TEXT;
  if (result.provider === 'azuracast' && !result.data.streamStatus) return RADIO_FALLBACK_TEXT;
  return result.data.currentSong || RADIO_FALLBACK_TEXT;
}
