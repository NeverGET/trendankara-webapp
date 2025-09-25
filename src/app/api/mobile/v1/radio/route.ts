import { NextRequest, NextResponse } from 'next/server';
import { getActiveSettings, testStreamConnection } from '@/lib/db/queries/radioSettings';
import { MobileRadioConfig } from '@/types/mobile';
import { CACHE_TAGS, cacheWithTag } from '@/lib/cache/invalidation';
import * as crypto from 'crypto';

// Memory cache for radio configuration with TTL
interface CachedRadioConfig {
  data: MobileRadioConfig;
  timestamp: number;
  etag: string;
  connectionTestTime: number;
}

// Memory cache storage with 30-second TTL for main config and 60-second TTL for connection tests
const radioConfigCache = new Map<string, CachedRadioConfig>();
const CACHE_TTL_CONFIG = 30 * 1000; // 30 seconds for config
const CACHE_TTL_CONNECTION = 60 * 1000; // 60 seconds for connection tests
const MAX_CACHE_SIZE = 100; // Prevent memory leaks

/**
 * Clear the memory cache for mobile radio configuration
 * Used by cache invalidation system when radio settings are updated
 */
function clearMobileRadioCache(): void {
  radioConfigCache.clear();
  console.log('Mobile radio memory cache cleared due to settings update');
}

/**
 * Generate ETag for mobile radio configuration
 */
function generateETag(config: MobileRadioConfig): string {
  const configString = JSON.stringify({
    stream_url: config.stream_url,
    metadata_url: config.metadata_url,
    station_name: config.station_name,
    connection_status: config.connection_status
  });
  return `"mobile-radio-${crypto.createHash('md5').update(configString).digest('hex').slice(0, 16)}"`;
}

/**
 * Clean expired cache entries to prevent memory leaks
 */
function cleanExpiredCache(): void {
  const now = Date.now();
  const entries = Array.from(radioConfigCache.entries());

  // Remove expired entries
  for (const [key, cached] of entries) {
    if (now - cached.timestamp > CACHE_TTL_CONFIG) {
      radioConfigCache.delete(key);
    }
  }

  // If cache is still too large, remove oldest entries
  if (radioConfigCache.size > MAX_CACHE_SIZE) {
    const allEntries = Array.from(radioConfigCache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    const toRemove = allEntries.slice(0, radioConfigCache.size - MAX_CACHE_SIZE);
    for (const [key] of toRemove) {
      radioConfigCache.delete(key);
    }
  }
}

/**
 * Mobile Radio Configuration API Endpoint with Advanced Caching
 *
 * GET /api/mobile/v1/radio
 *
 * Provides current radio streaming configuration for mobile apps with:
 * - Sub-200ms response time through memory caching
 * - ETag headers for efficient conditional requests
 * - Connection status caching with appropriate TTL
 * - Active stream URL from database with automatic fallback
 * - Real-time connection status testing with smart caching
 * - Station metadata and configuration details
 *
 * Performance Features:
 * - Memory-based caching for frequently accessed data
 * - ETags for conditional requests (304 Not Modified)
 * - Separate TTL for configuration vs connection testing
 * - Cache invalidation when settings change
 * - Response time monitoring and optimization
 *
 * Requirements:
 * - 5.1: Return active streaming URL from database
 * - 5.2: Immediate reflection of admin setting updates
 * - 5.3: Include stream_url, metadata_url, station_name, and connection status
 * - 5.4: Fallback to environment variables when no active settings exist
 * - 5.5: Respond within 200ms with caching
 * - 5.6: Include connection validation and status
 *
 * Response Format: MobileRadioConfig
 * - stream_url: Primary streaming endpoint
 * - metadata_url: Optional metadata endpoint for now playing info
 * - station_name: Display name for radio station
 * - connection_status: 'active' | 'testing' | 'failed'
 * - last_tested: ISO timestamp of last connectivity test
 *
 * @param request NextRequest - Incoming request object
 * @returns NextResponse<{ success: boolean, data: MobileRadioConfig, error: string | null }>
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const cacheKey = 'mobile-radio-config';

  // Clean expired cache entries periodically
  cleanExpiredCache();

  try {
    // Step 1: Check for conditional request with If-None-Match header
    const ifNoneMatch = request.headers.get('if-none-match');

    // Step 2: Check memory cache for fast response
    const cached = radioConfigCache.get(cacheKey);
    const now = Date.now();

    if (cached) {
      // Check if config cache is still valid
      const configCacheValid = (now - cached.timestamp) < CACHE_TTL_CONFIG;

      // Check if connection test cache is still valid
      const connectionCacheValid = (now - cached.connectionTestTime) < CACHE_TTL_CONNECTION;

      if (configCacheValid) {
        // If client has matching ETag, return 304 Not Modified
        if (ifNoneMatch === cached.etag) {
          const responseTime = Date.now() - startTime;
          console.log(`Mobile radio API cache hit (304): ${responseTime}ms`);

          return new NextResponse(null, {
            status: 304,
            headers: {
              'ETag': cached.etag,
              'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
              'X-Response-Time': `${responseTime}ms`,
              'X-Cache-Status': 'hit-304'
            }
          });
        }

        // If connection test is still valid, return cached data immediately
        if (connectionCacheValid) {
          const responseTime = Date.now() - startTime;
          console.log(`Mobile radio API cache hit (full): ${responseTime}ms`);

          return NextResponse.json(
            {
              success: true,
              data: cached.data,
              error: null
            },
            {
              status: 200,
              headers: {
                'ETag': cached.etag,
                'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
                'X-Response-Time': `${responseTime}ms`,
                'X-Cache-Status': 'hit-full',
                'X-Data-Source': 'cache'
              }
            }
          );
        }
      }
    }

    // Step 3: Retrieve active radio settings from database (cache miss or expired)
    const activeSettings = await getActiveSettings();

    let stream_url: string;
    let metadata_url: string | null = null;
    let station_name: string;
    let usedFallback = false;

    if (activeSettings) {
      // Use database settings
      stream_url = activeSettings.stream_url;
      metadata_url = activeSettings.metadata_url;
      station_name = activeSettings.station_name;
    } else {
      // Step 2: Fallback to environment variables (Requirement 5.4)
      stream_url = process.env.RADIO_STREAM_URL || 'https://radyo.yayin.com.tr:5132/stream';
      metadata_url = process.env.RADIO_METADATA_URL || null;
      station_name = process.env.SITE_NAME || 'Trend Ankara Radio';
      usedFallback = true;

      console.warn('No active radio settings found in database, using environment fallback');
    }

    // Step 4: Determine if we need to test connection or use cached status
    let connection_status: 'active' | 'testing' | 'failed' = 'testing';
    let last_tested: string = new Date().toISOString();
    let shouldTestConnection = true;

    // If we have cached data and connection test is still valid, reuse it
    if (cached && (now - cached.connectionTestTime) < CACHE_TTL_CONNECTION) {
      connection_status = cached.data.connection_status;
      last_tested = cached.data.last_tested;
      shouldTestConnection = false;
      console.log('Reusing cached connection status for performance');
    }

    if (shouldTestConnection) {
      // Test stream connectivity for real-time status (Requirement 5.3)
      const testStartTime = Date.now();
      last_tested = new Date().toISOString();

      try {
        // Perform connectivity test with 3-second timeout for faster mobile response
        const testResult = await Promise.race([
          testStreamConnection(stream_url),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Test timeout')), 3000)
          )
        ]);

        connection_status = testResult.isValid ? 'active' : 'failed';

        if (!testResult.isValid) {
          console.warn(`Stream connectivity test failed for ${stream_url}: ${testResult.error}`);
        }

        const testDuration = Date.now() - testStartTime;
        console.log(`Stream connectivity test completed in ${testDuration}ms`);
      } catch (error) {
        // Don't fail the entire request if connectivity test fails
        connection_status = 'failed';
        console.error('Stream connectivity test error:', error);
      }
    }

    // Step 5: Build mobile radio configuration response
    const mobileConfig: MobileRadioConfig = {
      stream_url,
      metadata_url,
      station_name,
      connection_status,
      last_tested
    };

    // Step 6: Generate ETag for the new configuration
    const etag = generateETag(mobileConfig);

    // Step 7: Update memory cache with new data
    const cacheEntry: CachedRadioConfig = {
      data: mobileConfig,
      timestamp: now,
      etag,
      connectionTestTime: shouldTestConnection ? now : (cached?.connectionTestTime || now)
    };
    radioConfigCache.set(cacheKey, cacheEntry);

    // Calculate total response time
    const responseTime = Date.now() - startTime;

    // Determine cache status for monitoring
    const cacheStatus = cached ? 'hit-stale' : 'miss';

    // Log performance metrics for mobile API monitoring
    console.log(`Mobile radio API response time: ${responseTime}ms (${usedFallback ? 'fallback' : 'database'}) [${cacheStatus}]`);

    // Performance warning if response time exceeds target
    if (responseTime > 200) {
      console.warn(`Mobile API response time exceeded 200ms target: ${responseTime}ms`);
    }

    // Step 8: Return mobile API formatted response with caching headers
    return NextResponse.json(
      {
        success: true,
        data: mobileConfig,
        error: null
      },
      {
        status: 200,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
          'X-Response-Time': `${responseTime}ms`,
          'X-Data-Source': usedFallback ? 'environment' : 'database',
          'X-Cache-Status': cacheStatus,
          'X-Connection-Test': shouldTestConnection ? 'fresh' : 'cached',
          'Vary': 'If-None-Match'
        }
      }
    );

  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error('Mobile radio API error:', {
      error: errorMessage,
      responseTime,
      stack: error instanceof Error ? error.stack : undefined
    });

    // Return error response in mobile API format
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: 'Failed to retrieve radio configuration'
      },
      {
        status: 500,
        headers: {
          'X-Response-Time': `${responseTime}ms`,
          'X-Cache-Status': 'error'
        }
      }
    );
  }
}
