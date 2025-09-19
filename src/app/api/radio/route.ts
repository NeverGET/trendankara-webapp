import { NextRequest, NextResponse } from 'next/server';
import { getActiveSettings, getStreamUrlWithFallback } from '@/lib/db/queries/radioSettings';

/**
 * Public API endpoint for radio configuration
 * Fetches configuration from database with environment variable fallbacks
 * Supports requirements 2.4 (settings reload) and 3.1 (fast config updates)
 */
export async function GET(request: NextRequest) {
  try {
    // Try to fetch settings from database first with fallback mechanism
    let radioConfig: any = null;

    try {
      const dbSettings = await getActiveSettings();
      if (dbSettings) {
        // Get stream URL with automatic fallback if main URL fails
        const streamResult = await getStreamUrlWithFallback();

        radioConfig = {
          stream_url: streamResult.url,
          metadata_url: dbSettings.metadata_url,
          station_name: dbSettings.station_name,
          station_description: dbSettings.station_description,
          social_links: {
            facebook: dbSettings.facebook_url,
            twitter: dbSettings.twitter_url,
            instagram: dbSettings.instagram_url,
            youtube: dbSettings.youtube_url,
          },
          is_active: dbSettings.is_active,
          updated_at: dbSettings.updated_at,
          // Add fallback indicator for monitoring
          is_fallback_url: streamResult.isFallback
        };

        // Log fallback usage for monitoring
        if (streamResult.isFallback) {
          console.warn('Radio config using fallback stream URL:', streamResult.url);
        }
      }
    } catch (dbError) {
      console.warn('Database query failed, falling back to environment variables:', dbError);
    }

    // Fallback to environment variables if database config is not available
    if (!radioConfig) {
      radioConfig = {
        stream_url: process.env.RADIO_STREAM_URL || 'https://radyo.yayin.com.tr:5132/stream',
        metadata_url: process.env.RADIO_METADATA_URL || 'https://radyo.yayin.com.tr:5132/',
        station_name: 'Trend Ankara Radio',
        station_description: 'En güncel müzikler ve haberler',
        social_links: {
          facebook: null,
          twitter: null,
          instagram: null,
          youtube: null,
        },
        is_active: true,
        updated_at: new Date().toISOString()
      };
    }

    // Add CORS proxy if available
    if (process.env.RADIO_CORS_PROXY) {
      radioConfig.cors_proxy = process.env.RADIO_CORS_PROXY;
    }

    // Prepare response with caching headers
    const response = NextResponse.json({
      success: true,
      data: radioConfig
    });

    // Cache for 30 seconds to support fast updates (requirement 3.1)
    // but still provide reasonable performance
    response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=30');
    response.headers.set('CDN-Cache-Control', 'public, max-age=30');
    response.headers.set('Vercel-CDN-Cache-Control', 'public, max-age=30');

    // Add ETag for efficient caching
    const etag = `"radio-config-${Buffer.from(JSON.stringify(radioConfig)).toString('base64').slice(0, 16)}"`;
    response.headers.set('ETag', etag);

    // Check for conditional requests
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 });
    }

    return response;
  } catch (error) {
    console.error('Error fetching radio configuration:', error);

    // Return minimal fallback configuration on error
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch radio configuration',
      data: {
        stream_url: process.env.RADIO_STREAM_URL || 'https://radyo.yayin.com.tr:5132/stream',
        metadata_url: process.env.RADIO_METADATA_URL || 'https://radyo.yayin.com.tr:5132/',
        station_name: 'Trend Ankara Radio',
        station_description: 'En güncel müzikler ve haberler',
        social_links: {
          facebook: null,
          twitter: null,
          instagram: null,
          youtube: null,
        },
        is_active: true,
        updated_at: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
