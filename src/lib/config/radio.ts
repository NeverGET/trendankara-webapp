/**
 * Server-side radio configuration resolver.
 *
 * SERVER ONLY — this module reaches into the database layer (mysql2).
 * Client components must import `@/lib/config/radioDefaults` instead; the live
 * values reach the browser through `GET /api/radio`.
 *
 * Precedence: active `radio_settings` DB row -> env vars -> hard-coded defaults
 * (`@/lib/config/radioDefaults`). Nothing here throws: if the database is
 * unreachable the resolver degrades to env/defaults so proxy routes and pages
 * keep rendering.
 */

import { unstable_cache } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/invalidation';
import { getActiveSettings, type RadioSettingsEntity } from '@/lib/db/queries/radioSettings';
import {
  RADIO_DEFAULT_METADATA_URL,
  RADIO_DEFAULT_STATION_DESCRIPTION,
  RADIO_DEFAULT_STATION_NAME,
  RADIO_DEFAULT_STREAM_URL,
  deriveRadioEndpoints,
  type RadioConfigSource,
  type RadioEndpoints,
} from './radioDefaults';

export * from './radioDefaults';

export interface ResolvedRadioConfig {
  streamUrl: string;
  metadataUrl: string;
  stationName: string;
  stationDescription: string | null;
  socialLinks: {
    facebook: string | null;
    twitter: string | null;
    instagram: string | null;
    youtube: string | null;
  };
  isActive: boolean;
  /** ISO timestamp — stable per configuration so it can back an ETag. */
  updatedAt: string;
  source: RadioConfigSource;
  endpoints: RadioEndpoints;
}

/** Stable timestamp for non-database configs so the /api/radio ETag doesn't churn. */
const STATIC_CONFIG_TIMESTAMP = new Date(0).toISOString();

/**
 * Env-var (then hard-coded default) configuration. Synchronous, never throws.
 */
export function getRadioConfigFromEnv(): ResolvedRadioConfig {
  const envStreamUrl = process.env.RADIO_STREAM_URL?.trim();
  const envMetadataUrl = process.env.RADIO_METADATA_URL?.trim();
  const envCorsProxy = process.env.RADIO_CORS_PROXY?.trim();

  const streamUrl = envStreamUrl || RADIO_DEFAULT_STREAM_URL;
  const metadataUrl = envMetadataUrl || RADIO_DEFAULT_METADATA_URL;

  return {
    streamUrl,
    metadataUrl,
    stationName: process.env.SITE_NAME?.trim() || RADIO_DEFAULT_STATION_NAME,
    stationDescription: RADIO_DEFAULT_STATION_DESCRIPTION,
    socialLinks: { facebook: null, twitter: null, instagram: null, youtube: null },
    isActive: true,
    updatedAt: STATIC_CONFIG_TIMESTAMP,
    source: envStreamUrl || envMetadataUrl ? 'environment' : 'default',
    endpoints: deriveRadioEndpoints({ streamUrl, metadataUrl, corsProxy: envCorsProxy }),
  };
}

function fromDatabase(settings: RadioSettingsEntity): ResolvedRadioConfig {
  const streamUrl = settings.stream_url?.trim() || RADIO_DEFAULT_STREAM_URL;
  const metadataUrl =
    settings.metadata_url?.trim() || process.env.RADIO_METADATA_URL?.trim() || streamUrl;

  const updatedAt =
    settings.updated_at instanceof Date
      ? settings.updated_at.toISOString()
      : String(settings.updated_at ?? STATIC_CONFIG_TIMESTAMP);

  return {
    streamUrl,
    metadataUrl,
    stationName: settings.station_name || RADIO_DEFAULT_STATION_NAME,
    stationDescription: settings.station_description ?? RADIO_DEFAULT_STATION_DESCRIPTION,
    socialLinks: {
      facebook: settings.facebook_url ?? null,
      twitter: settings.twitter_url ?? null,
      instagram: settings.instagram_url ?? null,
      youtube: settings.youtube_url ?? null,
    },
    isActive: settings.is_active ?? true,
    updatedAt,
    source: 'database',
    endpoints: deriveRadioEndpoints({
      streamUrl,
      metadataUrl,
      corsProxy: process.env.RADIO_CORS_PROXY,
    }),
  };
}

/**
 * Read the active settings row. Cached for 30s and tagged so an admin save
 * (`invalidateEntityCache('radio')`) flushes it immediately. Swallows database
 * errors — callers fall through to env/defaults.
 */
const loadActiveSettings = unstable_cache(
  async (): Promise<RadioSettingsEntity | null> => {
    try {
      return await getActiveSettings();
    } catch (error) {
      console.warn('[radio-config] database unavailable, using env/default config:', error);
      return null;
    }
  },
  ['radio-active-settings'],
  { tags: [CACHE_TAGS.RADIO_CONFIG, CACHE_TAGS.RADIO_SETTINGS], revalidate: 30 }
);

/**
 * Fully resolved radio configuration: database -> env -> hard-coded default.
 */
export async function getRadioConfig(): Promise<ResolvedRadioConfig> {
  try {
    const settings = await loadActiveSettings();
    if (settings?.stream_url) {
      return fromDatabase(settings);
    }
  } catch (error) {
    console.warn('[radio-config] failed to resolve settings from database:', error);
  }

  return getRadioConfigFromEnv();
}

/**
 * Just the derived URLs (stream / currentsong / stats / 7.html / CORS proxy).
 * This is what the proxy routes should use.
 */
export async function getRadioEndpoints(): Promise<RadioEndpoints> {
  const config = await getRadioConfig();
  return config.endpoints;
}
