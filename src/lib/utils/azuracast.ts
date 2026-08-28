/**
 * AzuraCast now-playing client.
 *
 * Talks to `<origin>/api/nowplaying/<shortcode>` and flattens the response into
 * {@link NormalizedRadioMetadata} — the same shape the Shoutcast path produces,
 * so `/api/radio/*` response contracts are provider-independent.
 *
 * Two things this module is deliberately strict about:
 *
 *  1. HTTP 200 is NOT success. AzuraCast answers unknown paths with its own
 *     HTML app shell (or a Slim 404 page) at various status codes, and a
 *     Shoutcast box answers `/api/nowplaying/...` with something else entirely.
 *     Every response is shape-validated before it is trusted.
 *  2. Every human-readable string is run through `fixTurkishMojibake`, because
 *     some upstream feeds emit Windows-1254 bytes decoded as Latin-1.
 */

import { fixTurkishMojibake } from '@/lib/utils/turkishEncoding';

/** Only the fields we actually consume are modelled. */
export interface AzuracastSong {
  text?: string | null;
  artist?: string | null;
  title?: string | null;
  album?: string | null;
  art?: string | null;
}

export interface AzuracastMount {
  name?: string | null;
  url?: string | null;
  bitrate?: number | null;
  format?: string | null;
}

export interface AzuracastHistoryItem {
  song?: AzuracastSong | null;
  /** Unix seconds. */
  played_at?: number | null;
  duration?: number | null;
}

export interface AzuracastNowPlayingPayload {
  station?: {
    name?: string | null;
    shortcode?: string | null;
    listen_url?: string | null;
    mounts?: AzuracastMount[] | null;
  } | null;
  listeners?: {
    current?: number | null;
    unique?: number | null;
    total?: number | null;
  } | null;
  now_playing?: {
    song?: AzuracastSong | null;
    duration?: number | null;
    elapsed?: number | null;
  } | null;
  playing_next?: { song?: AzuracastSong | null } | null;
  song_history?: AzuracastHistoryItem[] | null;
  is_online?: boolean | null;
}

/**
 * One structured entry of the recently-played list. Only AzuraCast can supply
 * this; the Shoutcast readers leave `songHistoryEntries` undefined.
 */
export interface RadioHistoryEntry {
  artist: string | null;
  title: string | null;
  album: string | null;
  art: string | null;
  /** ISO timestamp, or `null` when the server did not report one. */
  playedAt: string | null;
  /** Track length in seconds. */
  duration: number;
}

/**
 * Provider-neutral metadata. Both the AzuraCast and the Shoutcast readers
 * produce this, and the API routes project their public contracts out of it.
 */
export interface NormalizedRadioMetadata {
  provider: 'azuracast' | 'shoutcast';
  /** Full "Artist - Title" line. Empty string when the server reports nothing. */
  currentSong: string;
  artist: string | null;
  title: string | null;
  album: string | null;
  /** Album art URL, AzuraCast only. */
  art: string | null;
  currentListeners: number;
  uniqueListeners: number;
  peakListeners: number;
  maxListeners: number;
  averageTime: number;
  /** Kept as a string to match the historic Shoutcast contract. */
  bitrate: string;
  serverTitle: string;
  streamStatus: boolean;
  streamUptime: number;
  /** Next queued track, when the server advertises one. */
  playingNext: string | null;
  /** Most recent tracks, newest first. */
  songHistory: string[];
  /**
   * Structured form of {@link songHistory}. Optional because only AzuraCast
   * exposes the per-track detail; consumers must tolerate `undefined`.
   */
  songHistoryEntries?: RadioHistoryEntry[];
  /** Track length in seconds (0 for live sources). */
  duration: number;
  /** Seconds elapsed into the current track. */
  elapsed: number;
  /** Mount/listen URL the server itself advertises. */
  listenUrl: string | null;
}

export interface AzuracastFetchResult {
  success: boolean;
  data?: NormalizedRadioMetadata;
  error?: string;
  /** HTTP status, when a response was actually received. */
  statusCode?: number;
  responseTime: number;
  /** Which URL actually produced the data (or was tried last on failure). */
  endpointUsed?: string;
  /** Human-readable label for the endpoint that served the data. */
  endpointKind?: 'nowplaying_static' | 'nowplaying' | 'unknown';
  /** Errors from endpoints tried before the one that succeeded. */
  attempts?: Array<{ url: string; error: string }>;
}

/** Classify an AzuraCast API URL for logging/reporting. */
export function classifyAzuracastEndpoint(url: string): AzuracastFetchResult['endpointKind'] {
  if (url.includes('/api/nowplaying_static/')) return 'nowplaying_static';
  if (url.includes('/api/nowplaying/')) return 'nowplaying';
  return 'unknown';
}

const DEFAULT_TIMEOUT_MS = 5000;

function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : fallback;
}

/** Trim + repair Turkish mojibake; empty/whitespace collapses to `null`. */
function cleanString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const repaired = fixTurkishMojibake(value).trim();
  return repaired.length > 0 ? repaired : null;
}

/**
 * Validate that a parsed JSON body really is an AzuraCast now-playing payload.
 *
 * This is the guard that stops an HTML app shell, a Shoutcast stats blob, or a
 * proxy error page from being mistaken for a good response just because the
 * status line said 200.
 */
export function isAzuracastNowPlayingPayload(
  data: unknown
): data is AzuracastNowPlayingPayload {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;

  const payload = data as Record<string, unknown>;

  const station = payload.station;
  if (!station || typeof station !== 'object' || Array.isArray(station)) return false;

  // A real payload always identifies its station.
  const stationRecord = station as Record<string, unknown>;
  if (typeof stationRecord.shortcode !== 'string' && typeof stationRecord.name !== 'string') {
    return false;
  }

  // ...and always carries a now_playing object plus a listeners object.
  const nowPlaying = payload.now_playing;
  if (!nowPlaying || typeof nowPlaying !== 'object' || Array.isArray(nowPlaying)) return false;

  const listeners = payload.listeners;
  if (!listeners || typeof listeners !== 'object' || Array.isArray(listeners)) return false;

  return true;
}

/**
 * AzuraCast reports "Station Offline" as if it were a real track. Treat it as
 * "nothing playing" so callers can substitute their own copy.
 */
const OFFLINE_TITLE = 'station offline';

/**
 * Build the display line for a song.
 *
 * AzuraCast's ordering is ARTIST - TITLE (never TITLE - ARTIST), so artist and
 * title are composed first and the pre-joined `text` is only a fallback.
 */
function songToText(song: AzuracastSong | null | undefined): string | null {
  if (!song) return null;

  const artist = cleanString(song.artist);
  const title = cleanString(song.title);
  const text = cleanString(song.text);

  const composed = artist && title ? `${artist} - ${title}` : title || text;
  if (!composed) return null;

  // Guard both the raw title and the composed line.
  if (title?.toLowerCase() === OFFLINE_TITLE || composed.toLowerCase() === OFFLINE_TITLE) {
    return null;
  }

  return composed;
}

/**
 * Split a combined "ARTIST - TITLE" line.
 *
 * Only the FIRST ` - ` separates artist from title; every later one belongs to
 * the track name, so `'KAZANLI MESUT - SAÇLARINI ÖREMEDİM - EKREM ÖZEL'` keeps
 * its title intact instead of being truncated.
 */
export function splitArtistTitle(line: string | null | undefined): {
  artist: string | null;
  title: string | null;
} {
  const value = (line || '').trim();
  if (!value) return { artist: null, title: null };

  const parts = value.split(/\s+-\s+/);
  if (parts.length < 2) return { artist: null, title: value };

  return {
    artist: parts[0].trim() || null,
    title: parts.slice(1).join(' - ').trim() || null,
  };
}

/**
 * Turn one `song_history` item into a structured entry.
 *
 * Falls back to splitting the composed line when the server only supplies
 * `text` (some AzuraCast relays do exactly that).
 */
function toHistoryEntry(item: AzuracastHistoryItem | null | undefined): RadioHistoryEntry | null {
  const composed = songToText(item?.song);
  if (!composed) return null;

  let artist = cleanString(item?.song?.artist);
  let title = cleanString(item?.song?.title);

  if (!artist || !title) {
    const split = splitArtistTitle(composed);
    artist = artist ?? split.artist;
    title = title ?? split.title;
  }

  const playedAtSeconds = toFiniteNumber(item?.played_at, 0);

  return {
    artist,
    title,
    album: cleanString(item?.song?.album),
    art: cleanString(item?.song?.art),
    playedAt: playedAtSeconds > 0 ? new Date(playedAtSeconds * 1000).toISOString() : null,
    duration: toFiniteNumber(item?.duration),
  };
}

/**
 * Flatten an AzuraCast payload into the provider-neutral shape.
 * Pure — unit-testable against a captured payload with no network.
 */
export function normalizeAzuracastNowPlaying(
  payload: AzuracastNowPlayingPayload
): NormalizedRadioMetadata {
  const station = payload.station ?? {};
  const listeners = payload.listeners ?? {};
  const nowPlaying = payload.now_playing ?? {};

  const mounts = Array.isArray(station.mounts) ? station.mounts : [];
  // Prefer the mount that matches the advertised listen URL, else the first one.
  const primaryMount =
    mounts.find((mount) => mount?.url && mount.url === station.listen_url) ?? mounts[0] ?? null;

  const currentListeners = toFiniteNumber(listeners.current);
  const uniqueListeners = toFiniteNumber(listeners.unique);
  const totalListeners = toFiniteNumber(listeners.total);

  const rawHistory = Array.isArray(payload.song_history) ? payload.song_history : [];
  const songHistoryEntries = rawHistory
    .map(toHistoryEntry)
    .filter((entry): entry is RadioHistoryEntry => entry !== null);
  const songHistory = rawHistory
    .map((entry) => songToText(entry?.song))
    .filter((text): text is string => Boolean(text));

  return {
    provider: 'azuracast',
    currentSong: songToText(nowPlaying.song) ?? '',
    artist: cleanString(nowPlaying.song?.artist),
    title: cleanString(nowPlaying.song?.title),
    album: cleanString(nowPlaying.song?.album),
    art: cleanString(nowPlaying.song?.art),
    currentListeners,
    uniqueListeners,
    // AzuraCast's public now-playing API exposes no historical peak; `total`
    // (concurrent connections) is the closest honest stand-in.
    peakListeners: Math.max(currentListeners, totalListeners),
    maxListeners: 0,
    averageTime: 0,
    bitrate: primaryMount?.bitrate ? String(primaryMount.bitrate) : '128',
    serverTitle: cleanString(station.name) ?? 'Trend Ankara Radio',
    streamStatus: payload.is_online === true,
    streamUptime: 0,
    playingNext: songToText(payload.playing_next?.song),
    songHistory,
    songHistoryEntries,
    duration: toFiniteNumber(nowPlaying.duration),
    elapsed: toFiniteNumber(nowPlaying.elapsed),
    listenUrl: cleanString(station.listen_url),
  };
}

/**
 * Fetch and normalize AzuraCast now-playing data. Never throws.
 *
 * @param nowPlayingUrl `<origin>/api/nowplaying/<shortcode>`
 */
export async function fetchAzuracastNowPlaying(
  nowPlayingUrl: string,
  options: { timeout?: number; revalidate?: number } = {}
): Promise<AzuracastFetchResult> {
  const startTime = Date.now();
  const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;

  if (!nowPlayingUrl) {
    return { success: false, error: 'No AzuraCast API URL configured', responseTime: 0 };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(nowPlayingUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'TrendAnkara-WebApp/1.0',
      },
      signal: controller.signal,
      ...(typeof options.revalidate === 'number'
        ? { next: { revalidate: options.revalidate } }
        : { cache: 'no-store' as const }),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        error: `AzuraCast API returned ${response.status} ${response.statusText}`,
        statusCode: response.status,
        responseTime,
        endpointUsed: nowPlayingUrl,
        endpointKind: classifyAzuracastEndpoint(nowPlayingUrl),
      };
    }

    // 200 proves nothing on AzuraCast — parse and shape-check before trusting.
    const raw = await response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return {
        success: false,
        error: 'AzuraCast API returned a non-JSON body (likely an HTML app shell)',
        statusCode: response.status,
        responseTime,
        endpointUsed: nowPlayingUrl,
        endpointKind: classifyAzuracastEndpoint(nowPlayingUrl),
      };
    }

    if (!isAzuracastNowPlayingPayload(parsed)) {
      return {
        success: false,
        error: 'Response did not match the AzuraCast now-playing shape',
        statusCode: response.status,
        responseTime,
        endpointUsed: nowPlayingUrl,
        endpointKind: classifyAzuracastEndpoint(nowPlayingUrl),
      };
    }

    return {
      success: true,
      data: normalizeAzuracastNowPlaying(parsed),
      statusCode: response.status,
      responseTime,
      endpointUsed: nowPlayingUrl,
      endpointKind: classifyAzuracastEndpoint(nowPlayingUrl),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    let message = 'Unknown error occurred';

    if (error instanceof Error) {
      message =
        error.name === 'AbortError'
          ? `AzuraCast API timeout (${timeout}ms exceeded)`
          : error.message;
    }

    return {
      success: false,
      error: message,
      responseTime,
      endpointUsed: nowPlayingUrl,
      endpointKind: classifyAzuracastEndpoint(nowPlayingUrl),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Try each AzuraCast endpoint in order and return the first good payload.
 *
 * The configured order is static-file-first (`/api/nowplaying_static/<sc>.json`)
 * then the dynamic API (`/api/nowplaying/<sc>`). Both return the identical JSON
 * shape; the static copy may lag a few seconds, which is irrelevant at a 10s
 * poll and keeps the load off PHP. Falling back also covers installs where the
 * static writer is switched off.
 *
 * Never throws. On total failure the last attempt's error is returned along
 * with the full attempt list.
 */
export async function fetchAzuracastNowPlayingWithFallback(
  urls: string[],
  options: { timeout?: number; revalidate?: number } = {}
): Promise<AzuracastFetchResult> {
  const candidates = urls.filter((url) => typeof url === 'string' && url.length > 0);

  if (candidates.length === 0) {
    return { success: false, error: 'No AzuraCast API URL configured', responseTime: 0 };
  }

  const attempts: Array<{ url: string; error: string }> = [];
  let last: AzuracastFetchResult | null = null;

  for (const url of candidates) {
    const result = await fetchAzuracastNowPlaying(url, options);

    if (result.success) {
      return attempts.length > 0 ? { ...result, attempts } : result;
    }

    attempts.push({ url, error: result.error || 'Unknown error' });
    last = result;
  }

  return { ...(last as AzuracastFetchResult), attempts };
}
