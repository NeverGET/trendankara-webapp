/**
 * Radio endpoint defaults and URL derivation (isomorphic).
 *
 * THIS IS THE ONLY PLACE IN `src/` WHERE THE STREAM HOST IS HARD-CODED.
 * Everything else must resolve its endpoints through `@/lib/config/radio`
 * (server, database-aware) or through the constants exported here (client).
 *
 * Resolution precedence implemented by `@/lib/config/radio`:
 *   1. active `radio_settings` row in the database
 *   2. RADIO_STREAM_URL / RADIO_METADATA_URL / RADIO_CORS_PROXY env vars
 *   3. the constants below (last resort)
 *
 * This module intentionally has NO imports so it is safe to pull into client
 * bundles (e.g. RadioPlayerContext default props) and into the mobile API
 * layer. Never import the database layer from here.
 */

/** Last-resort stream URL. Mirrors RADIO_STREAM_URL in .env */
export const RADIO_DEFAULT_STREAM_URL =
  'https://stream.netradyom.com/listen/trendradyo/radio.mp3';

/**
 * Last-resort metadata URL. Mirrors RADIO_METADATA_URL in .env.
 *
 * For AzuraCast this is the now-playing API endpoint; for a Shoutcast server it
 * is the server root ending in `/`. `deriveRadioEndpoints` handles both.
 */
export const RADIO_DEFAULT_METADATA_URL =
  'https://stream.netradyom.com/api/nowplaying/trendradyo';

/**
 * Last-resort CORS proxy. Mirrors RADIO_CORS_PROXY in .env.
 *
 * AzuraCast sends `Access-Control-Allow-Origin: *` on both its API and its
 * mount, so this is unused on the AzuraCast path. It is retained because the
 * Shoutcast path (still selectable from the admin panel, and still what the
 * production `radio_settings` row holds) needs it.
 */
export const RADIO_DEFAULT_CORS_PROXY = 'https://cros9.yayin.com.tr';

/** Secondary emergency stream, used only by the fallback chain. */
export const RADIO_DEFAULT_SECONDARY_STREAM_URL = 'https://stream.radyotrendankara.com/listen';

/**
 * Placeholder copy shown whenever the server reports nothing useful (station
 * offline, upstream unreachable, or a "Station Offline" pseudo-track).
 *
 * Lives here rather than in `radioNowPlaying` so the client bundle can use it
 * without dragging the server-only database layer into the browser.
 */
export const RADIO_FALLBACK_TEXT = 'Radyo Çalıyor';

export const RADIO_DEFAULT_STATION_NAME = 'Trend Ankara Radio';
export const RADIO_DEFAULT_STATION_DESCRIPTION = 'En güncel müzikler ve haberler';

/** Where a resolved configuration came from. */
export type RadioConfigSource = 'database' | 'environment' | 'default';

/** Which metadata dialect the configured server speaks. */
export type RadioProvider = 'azuracast' | 'shoutcast';

/**
 * Every URL the proxy/metadata routes need, all derived from one base.
 */
export interface RadioEndpoints {
  /** Audio stream URL handed to <audio>. */
  streamUrl: string;
  /** Which metadata API to talk to. */
  provider: RadioProvider;
  /** AzuraCast station shortcode, or `null` on Shoutcast. */
  azuracastShortcode: string | null;
  /** `<origin>/api/nowplaying/<shortcode>` (dynamic API), or `null` on Shoutcast. */
  nowPlayingApiUrl: string | null;
  /** `<origin>/api/nowplaying_static/<shortcode>.json`, or `null` on Shoutcast. */
  nowPlayingStaticApiUrl: string | null;
  /**
   * Ordered AzuraCast probe chain: static cached file first (AzuraCast's own
   * recommendation for frequent polling — it never touches PHP), dynamic API
   * second. Empty on Shoutcast.
   */
  nowPlayingApiUrls: string[];
  /** Shoutcast root, always ends with `/`. */
  metadataBaseUrl: string;
  /** `<base>currentsong` */
  currentSongUrl: string;
  /** `<base>stats?sid=1` (XML) */
  statsXmlUrl: string;
  /** `<base>stats?json=1` (JSON) */
  statsJsonUrl: string;
  /** `<base>7.html` (legacy CSV) */
  legacyStatsUrl: string;
  /** CORS proxy prefix, no trailing slash. */
  corsProxy: string;
}

/** Everything derivable from an AzuraCast stream or API URL. */
export interface AzuracastDescriptor {
  /** Scheme + host + port, no trailing slash. */
  origin: string;
  /** Station shortcode, e.g. `trendradyo`. */
  shortcode: string;
  /** `<origin>/api/nowplaying/<shortcode>` — the dynamic API. */
  nowPlayingUrl: string;
  /** `<origin>/api/nowplaying_static/<shortcode>.json` — the cached static file. */
  nowPlayingStaticUrl: string;
  /**
   * Probe order: static file first, dynamic API as the fallback. Same JSON
   * shape from both; the static one can lag a few seconds, which is fine for a
   * 10s poll and spares the PHP application entirely.
   */
  nowPlayingUrls: string[];
  /** `<origin>/listen/<shortcode>/` — the mount base, always ends with `/`. */
  mountBaseUrl: string;
}

/**
 * Recognise an AzuraCast URL and pull the station shortcode out of it.
 * Pure and isomorphic; returns `null` for anything that isn't AzuraCast.
 *
 * Two signatures are accepted:
 *   - a mount URL:  `<origin>/listen/<shortcode>/<mount>`  (>= 3 segments, so a
 *     bare Icecast `/listen` or `/listen/stream` mount is NOT misread as
 *     AzuraCast)
 *   - an API URL:   `<origin>/api/nowplaying/<shortcode>`
 *
 * NOTE: `<origin>/public/<shortcode>` is deliberately NOT recognised — that is
 * AzuraCast's HTML player page, not a stream and not an API.
 */
export function describeAzuracastUrl(url: string | null | undefined): AzuracastDescriptor | null {
  const candidate = (url || '').trim();
  if (!candidate) return null;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;

  const segments = (parsed.pathname || '/').split('/').filter(Boolean);
  let shortcode: string | null = null;

  // `<origin>/api/nowplaying/<shortcode>[/...]` (dynamic API) and
  // `<origin>/api/nowplaying_static/<shortcode>.json` (cached static file).
  if (segments.length >= 3 && segments[0].toLowerCase() === 'api') {
    const kind = segments[1].toLowerCase();
    if (kind === 'nowplaying') {
      shortcode = segments[2];
    } else if (kind === 'nowplaying_static') {
      shortcode = segments[2].replace(/\.json$/i, '');
    }
  }

  // `<origin>/listen/<shortcode>/<mount>[/...]`
  if (!shortcode && segments.length >= 3 && segments[0].toLowerCase() === 'listen') {
    shortcode = segments[1];
  }

  if (!shortcode) return null;

  const nowPlayingUrl = `${parsed.origin}/api/nowplaying/${shortcode}`;
  const nowPlayingStaticUrl = `${parsed.origin}/api/nowplaying_static/${shortcode}.json`;

  return {
    origin: parsed.origin,
    shortcode,
    nowPlayingUrl,
    nowPlayingStaticUrl,
    // Static file first: AzuraCast recommends it for frequent polling because
    // it is served straight off disk. Dynamic API is the fallback for installs
    // where the static writer is disabled.
    nowPlayingUrls: [nowPlayingStaticUrl, nowPlayingUrl],
    mountBaseUrl: `${parsed.origin}/listen/${shortcode}/`,
  };
}

/**
 * Resolve the AzuraCast descriptor for a configuration, preferring an explicit
 * metadata URL over the stream URL. `null` means "this is a Shoutcast setup".
 */
export function resolveAzuracastDescriptor(input: {
  streamUrl?: string | null;
  metadataUrl?: string | null;
}): AzuracastDescriptor | null {
  const streamUrl = (input.streamUrl || '').trim();
  const metadataUrl = (input.metadataUrl || '').trim();

  // An empty configuration means "use the defaults", so resolve against the
  // default stream URL rather than silently reporting Shoutcast.
  if (!streamUrl && !metadataUrl) {
    return describeAzuracastUrl(RADIO_DEFAULT_STREAM_URL);
  }

  return describeAzuracastUrl(metadataUrl) ?? describeAzuracastUrl(streamUrl);
}

/**
 * Which metadata dialect a configuration speaks. Pure, so client code can call
 * it with the values it got from `GET /api/radio`.
 */
export function detectRadioProvider(input: {
  streamUrl?: string | null;
  metadataUrl?: string | null;
}): RadioProvider {
  return resolveAzuracastDescriptor(input) ? 'azuracast' : 'shoutcast';
}

/**
 * Last-resort *base* URL (always ends with `/`) for the legacy Shoutcast-shaped
 * paths. `RADIO_DEFAULT_METADATA_URL` is an AzuraCast API endpoint, which is not
 * a usable base, so the mount path is used instead.
 */
export const RADIO_DEFAULT_METADATA_BASE_URL =
  describeAzuracastUrl(RADIO_DEFAULT_STREAM_URL)?.mountBaseUrl ??
  `${RADIO_DEFAULT_STREAM_URL.replace(/\/[^/]*$/, '')}/`;

/**
 * Paths THIS application serves itself. `/api/radio/stream` and
 * `/api/radio/currentsong` exist so the published mobile app can keep working
 * without a store release (see those route files), which means an operator may
 * well store `https://<our-domain>/api/radio/stream` in `radio_settings`.
 *
 * If that value were then treated as an upstream we would get:
 *   - `/api/radio/stream` redirecting to itself  -> infinite redirect, and
 *   - the Shoutcast reader deriving `<base>currentsong` = our own
 *     `/api/radio/currentsong` -> a self-fetch loop that hammers the server.
 *
 * Both are guarded by this check. Host is deliberately ignored: the app may be
 * reached through several hostnames (apex, www, the container name), and no
 * legitimate upstream ever lives under `/api/radio`.
 */
const SELF_API_PREFIX = '/api/radio';

export function isSelfReferentialRadioUrl(url: string | null | undefined): boolean {
  const candidate = (url || '').trim();
  if (!candidate) return false;

  try {
    const path = new URL(candidate).pathname.toLowerCase().replace(/\/+$/, '');
    return path === SELF_API_PREFIX || path.startsWith(`${SELF_API_PREFIX}/`);
  } catch {
    return false;
  }
}

/** Path leaves that are endpoints rather than a base path segment. */
const ENDPOINT_LEAVES = new Set([
  'stream',
  'listen',
  'stats',
  'currentsong',
  'played',
  ';',
]);

/**
 * Reduce any stream/metadata URL to a Shoutcast base URL ending in `/`.
 * Never throws: an unparseable input falls back to `fallback`.
 */
export function normalizeMetadataBaseUrl(
  url: string | null | undefined,
  fallback: string = RADIO_DEFAULT_METADATA_BASE_URL
): string {
  const candidate = (url || '').trim();
  if (!candidate) return fallback;

  try {
    const parsed = new URL(candidate);
    let path = parsed.pathname || '/';
    const segments = path.split('/').filter(Boolean);
    const leaf = segments[segments.length - 1] ?? '';

    // Drop a trailing endpoint segment (`/stream`, `/7.html`, `/stats`, ...)
    if (leaf && (ENDPOINT_LEAVES.has(leaf.toLowerCase()) || leaf.includes('.'))) {
      segments.pop();
    }

    path = segments.length > 0 ? `/${segments.join('/')}/` : '/';
    return `${parsed.origin}${path}`;
  } catch {
    return fallback;
  }
}

/** Normalize a CORS proxy prefix (strip trailing slashes). */
export function normalizeCorsProxy(
  proxy: string | null | undefined,
  fallback: string = RADIO_DEFAULT_CORS_PROXY
): string {
  const candidate = (proxy || '').trim();
  if (!candidate) return fallback.replace(/\/+$/, '');
  return candidate.replace(/\/+$/, '');
}

/**
 * Build every derived endpoint from a stream URL (+ optional explicit metadata
 * base). When `metadataUrl` is omitted the base is derived from the stream URL,
 * so a single admin-panel change moves nowplaying/metadata/stats with it.
 */
export function deriveRadioEndpoints(input: {
  streamUrl?: string | null;
  metadataUrl?: string | null;
  corsProxy?: string | null;
}): RadioEndpoints {
  const streamUrl = (input.streamUrl || '').trim() || RADIO_DEFAULT_STREAM_URL;

  // `streamUrl` is returned verbatim (the player must use whatever is
  // configured, including our own `/api/radio/stream` redirect), but a
  // self-referential URL must never be used to DERIVE metadata endpoints —
  // that is how self-fetch loops start. Fall through to the defaults instead.
  const metadataSource = isSelfReferentialRadioUrl(input.metadataUrl)
    ? null
    : (input.metadataUrl || '').trim() || null;
  const streamSource = isSelfReferentialRadioUrl(streamUrl) ? null : streamUrl;

  const azuracast = resolveAzuracastDescriptor({
    streamUrl: streamSource,
    metadataUrl: metadataSource,
  });

  // On AzuraCast the metadata base is the station mount (`/listen/<sc>/`) —
  // running the generic normalizer over `/api/nowplaying/<sc>` would produce a
  // nonsense base. On Shoutcast the derivation is unchanged.
  const metadataBaseUrl = azuracast
    ? azuracast.mountBaseUrl
    : normalizeMetadataBaseUrl(
        metadataSource || streamSource,
        normalizeMetadataBaseUrl(RADIO_DEFAULT_STREAM_URL)
      );

  return {
    streamUrl,
    provider: azuracast ? 'azuracast' : 'shoutcast',
    azuracastShortcode: azuracast?.shortcode ?? null,
    nowPlayingApiUrl: azuracast?.nowPlayingUrl ?? null,
    nowPlayingStaticApiUrl: azuracast?.nowPlayingStaticUrl ?? null,
    nowPlayingApiUrls: azuracast?.nowPlayingUrls ?? [],
    metadataBaseUrl,
    currentSongUrl: `${metadataBaseUrl}currentsong`,
    statsXmlUrl: `${metadataBaseUrl}stats?sid=1`,
    statsJsonUrl: `${metadataBaseUrl}stats?json=1`,
    legacyStatsUrl: `${metadataBaseUrl}7.html`,
    corsProxy: normalizeCorsProxy(input.corsProxy),
  };
}

/** Endpoints built purely from the hard-coded defaults. */
export const RADIO_DEFAULT_ENDPOINTS: RadioEndpoints = deriveRadioEndpoints({
  streamUrl: RADIO_DEFAULT_STREAM_URL,
  metadataUrl: RADIO_DEFAULT_METADATA_URL,
  corsProxy: RADIO_DEFAULT_CORS_PROXY,
});

/** Prefix a target URL with the CORS proxy. */
export function toProxiedUrl(target: string, corsProxy?: string | null): string {
  return `${normalizeCorsProxy(corsProxy)}/${target}`;
}
