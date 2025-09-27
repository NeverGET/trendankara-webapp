/**
 * Mobile News List API Endpoint
 * Returns paginated news with mobile settings applied
 * Requirements: 1.3, 1.7 - Paginated news with caching
 */

import { NextRequest, NextResponse } from 'next/server';
import type { MobileApiResponse, PaginatedNews } from '@/types/mobile';
import newsService from '@/services/mobile/NewsService';
import configService from '@/services/mobile/ConfigService';
import cacheManager, { MobileCacheManager } from '@/lib/cache/MobileCacheManager';

const CACHE_TTL = 120; // 2 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const categoryId = searchParams.get('category_id');

    // Create cache key based on parameters
    const cacheKey = MobileCacheManager.createKey(
      'mobile',
      'news',
      page,
      limit,
      categoryId || 'all'
    );

    // Check for conditional request
    const ifNoneMatch = request.headers.get('if-none-match');

    // Check cache first
    const cached = cacheManager.get<PaginatedNews>(cacheKey);

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
      const response: MobileApiResponse<PaginatedNews> = {
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

    // Get mobile settings
    const settings = await configService.getSettings();

    // Check if news is enabled
    if (!settings.enableNews) {
      const response: MobileApiResponse<PaginatedNews> = {
        success: true,
        data: {
          items: [],
          pagination: {
            page: 1,
            limit: 0,
            total: 0,
            hasNext: false,
            hasPrev: false
          }
        },
        error: 'Haberler devre dışı'
      };

      return NextResponse.json(response);
    }

    // Get news from service
    const news = await newsService.getNewsList(
      page,
      limit,
      settings,
      categoryId ? parseInt(categoryId) : undefined
    );

    // Cache the result
    const entry = cacheManager.set(cacheKey, news, CACHE_TTL);

    // Prepare response
    const response: MobileApiResponse<PaginatedNews> = {
      success: true,
      data: news,
      pagination: news.pagination,
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
    console.error('Error in mobile news endpoint:', error);

    const response: MobileApiResponse<PaginatedNews> = {
      success: false,
      data: {
        items: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          hasNext: false,
          hasPrev: false
        }
      },
      error: 'Haberler yüklenirken bir hata oluştu'
    };

    return NextResponse.json(response, { status: 500 });
  }
}
