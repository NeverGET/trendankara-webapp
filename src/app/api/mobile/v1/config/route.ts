/**
 * Mobile Configuration API Endpoint
 * Returns mobile app settings and version check
 * Requirements: 1.8, 1.9 - Configuration and version management
 */

import { NextRequest, NextResponse } from 'next/server';
import type { MobileApiResponse, MobileSettings } from '@/types/mobile';
import configService from '@/services/mobile/ConfigService';
import cacheManager, { MobileCacheManager } from '@/lib/cache/MobileCacheManager';

const CACHE_TTL = 600; // 10 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse version parameter for update check
    const currentVersion = searchParams.get('version');
    
    // Create cache key
    const cacheKey = MobileCacheManager.createKey('mobile', 'config', 'settings');
    
    // Check for conditional request
    const ifNoneMatch = request.headers.get('if-none-match');
    
    // Check cache first
    const cached = cacheManager.get<MobileSettings>(cacheKey);
    
    if (cached) {
      // Check ETag match for 304 Not Modified
      if (ifNoneMatch && MobileCacheManager.isETagMatch(ifNoneMatch, cached.etag)) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            'ETag': cached.etag,
            'Cache-Control': `public, max-age=${CACHE_TTL}`,
          },
        });
      }
      
      // Return cached data
      const response: MobileApiResponse<MobileSettings> = {
        success: true,
        data: cached.data,
        cache: {
          etag: cached.etag,
          maxAge: CACHE_TTL
        }
      };
      
      // Add update available flag if version provided
      if (currentVersion) {
        const updateAvailable = await configService.isUpdateAvailable(currentVersion);
        response.meta = { updateAvailable };
      }
      
      return NextResponse.json(response, {
        headers: {
          'ETag': cached.etag,
          'Cache-Control': `public, max-age=${CACHE_TTL}`,
        },
      });
    }
    
    // Get settings from service
    const settings = await configService.getSettings();
    
    // Check for app update if version provided
    let updateAvailable = false;
    if (currentVersion) {
      updateAvailable = await configService.isUpdateAvailable(currentVersion);
    }
    
    // Cache the result
    const entry = cacheManager.set(cacheKey, settings, CACHE_TTL);
    
    // Prepare response
    const response: MobileApiResponse<MobileSettings> = {
      success: true,
      data: settings,
      cache: {
        etag: entry.etag,
        maxAge: CACHE_TTL
      }
    };
    
    // Add update flag if version check was performed
    if (currentVersion) {
      response.meta = { updateAvailable };
    }
    
    // Return response with cache headers
    return NextResponse.json(response, {
      headers: {
        'ETag': entry.etag,
        'Cache-Control': `public, max-age=${CACHE_TTL}`,
      },
    });
  } catch (error) {
    console.error('Error in mobile config endpoint:', error);
    
    const response: MobileApiResponse<null> = {
      success: false,
      data: null,
      error: 'Ayarlar yüklenirken bir hata oluştu'
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}