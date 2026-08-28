import { NextRequest, NextResponse } from 'next/server';
import { getRadioConfig, getRadioConfigFromEnv, type ResolvedRadioConfig } from '@/lib/config/radio';
import { getStreamUrlWithFallback } from '@/lib/db/queries/radioSettings';

/**
 * Public API endpoint for radio configuration.
 *
 * The single source of truth for the browser: the RadioPlayer and every other
 * client surface reads its stream/metadata URLs from here rather than from a
 * hard-coded literal. Resolution (database -> env -> default) lives in
 * `@/lib/config/radio`.
 *
 * Supports requirements 2.4 (settings reload) and 3.1 (fast config updates).
 */

function toPayload(config: ResolvedRadioConfig, overrides?: {
  streamUrl?: string;
  isFallbackUrl?: boolean;
}) {
  const payload: Record<string, unknown> = {
    // --- existing contract ---
    stream_url: overrides?.streamUrl ?? config.streamUrl,
    metadata_url: config.metadataUrl,
    station_name: config.stationName,
    station_description: config.stationDescription,
    social_links: {
      facebook: config.socialLinks.facebook,
      twitter: config.socialLinks.twitter,
      instagram: config.socialLinks.instagram,
      youtube: config.socialLinks.youtube,
    },
    is_active: config.isActive,
    updated_at: config.updatedAt,
    cors_proxy: config.endpoints.corsProxy,

    // --- additive ---
    config_source: config.source,
    provider: config.endpoints.provider,
  };

  if (overrides?.isFallbackUrl !== undefined) {
    payload.is_fallback_url = overrides.isFallbackUrl;
  }

  return payload;
}

export async function GET(request: NextRequest) {
  try {
    // Database -> environment -> hard-coded default. Never throws.
    const config = await getRadioConfig();

    let streamUrl = config.streamUrl;
    let isFallbackUrl: boolean | undefined;

    // Only probe the fallback chain when the config actually came from the DB;
    // env/default configs have nothing to fall back to.
    if (config.source === 'database') {
      try {
        const streamResult = await getStreamUrlWithFallback();
        streamUrl = streamResult.url;
        isFallbackUrl = streamResult.isFallback;

        if (streamResult.isFallback) {
          console.warn('Radio config using fallback stream URL:', streamResult.url);
        }
      } catch (fallbackError) {
        console.warn('Stream fallback probe failed, using configured URL:', fallbackError);
      }
    }

    const radioConfig = toPayload(config, { streamUrl, isFallbackUrl });

    // ETag is derived from the resolved configuration only (no per-request
    // timestamps), so repeat requests get a cheap 304 and an admin save
    // produces a genuinely new tag.
    const etag = `"radio-config-${Buffer.from(JSON.stringify(radioConfig)).toString('base64').slice(0, 16)}"`;

    // Check for conditional requests before building the body
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          'Cache-Control': 'public, max-age=0, must-revalidate, s-maxage=30, stale-while-revalidate=30',
        },
      });
    }

    const response = NextResponse.json({
      success: true,
      data: radioConfig
    });

    // Shared caches hold the config for 30s (requirement 3.1) but browsers
    // always revalidate, so an admin save + `invalidateEntityCache('radio')`
    // is visible on the next request instead of up to 30s later.
    response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate, s-maxage=30, stale-while-revalidate=30');
    response.headers.set('CDN-Cache-Control', 'public, max-age=30');
    response.headers.set('Vercel-CDN-Cache-Control', 'public, max-age=30');
    response.headers.set('ETag', etag);

    return response;
  } catch (error) {
    console.error('Error fetching radio configuration:', error);

    // Return minimal fallback configuration on error
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch radio configuration',
      data: toPayload(getRadioConfigFromEnv())
    }, { status: 500 });
  }
}
