/**
 * Mobile Cards API Endpoint
 * Returns card-based content for mobile display
 * Requirements: 2.1, 2.2, 2.3 - Card-based content management
 */

import { NextRequest, NextResponse } from 'next/server';
import type { MobileApiResponse, MobileCard } from '@/types/mobile';
import cardService from '@/services/mobile/CardService';
import cacheManager, { MobileCacheManager } from '@/lib/cache/MobileCacheManager';

const CACHE_TTL = 180; // 3 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse type filter
    const type = searchParams.get('type') as 'featured' | 'normal' | null;

    // Create cache key based on type
    const cacheKey = MobileCacheManager.createKey('mobile', 'cards', type || 'all');

    // Check for conditional request
    const ifNoneMatch = request.headers.get('if-none-match');

    // Check cache first
    const cached = cacheManager.get<MobileCard[]>(cacheKey);

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
      const response: MobileApiResponse<MobileCard[]> = {
        success: true,
        data: cached.data,
        cache: {
          etag: cached.etag,
          maxAge: CACHE_TTL
        }
      };

      return NextResponse.json(response, {
        headers: {
          'ETag': cached.etag,
          'Cache-Control': `public, max-age=${CACHE_TTL}`,
        },
      });
    }

    // Get cards from service
    const cards = await cardService.getCards(
      type && (type === 'featured' || type === 'normal') ? type : undefined
    );

    // Cache the result
    const entry = cacheManager.set(cacheKey, cards, CACHE_TTL);

    // Prepare response
    const response: MobileApiResponse<MobileCard[]> = {
      success: true,
      data: cards,
      cache: {
        etag: entry.etag,
        maxAge: CACHE_TTL
      }
    };

    // Return response with cache headers
    return NextResponse.json(response, {
      headers: {
        'ETag': entry.etag,
        'Cache-Control': `public, max-age=${CACHE_TTL}`,
      },
    });
  } catch (error) {
    console.error('Error in mobile cards endpoint:', error);

    const response: MobileApiResponse<MobileCard[]> = {
      success: false,
      data: [],
      error: 'Kartlar yüklenirken bir hata oluştu'
    };

    return NextResponse.json(response, { status: 500 });
  }
}