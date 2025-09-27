/**
 * Mobile News Detail API Endpoint
 * Returns full news article with image galleries
 * Requirements: 1.4 - Detailed news with image galleries
 */

import { NextRequest, NextResponse } from 'next/server';
import type { MobileApiResponse, MobileNewsDetail } from '@/types/mobile';
import newsService from '@/services/mobile/NewsService';
import cacheManager, { MobileCacheManager } from '@/lib/cache/MobileCacheManager';

const CACHE_TTL = 300; // 5 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Resolve params (Next.js 15 async params)
    const resolvedParams = await params;
    const { slug } = resolvedParams;

    if (!slug) {
      const response: MobileApiResponse<null> = {
        success: false,
        data: null,
        error: 'Haber bulunamadı'
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Create cache key
    const cacheKey = MobileCacheManager.createKey('mobile', 'news', 'detail', slug);

    // Check for conditional request
    const ifNoneMatch = request.headers.get('if-none-match');

    // Check cache first
    const cached = cacheManager.get<MobileNewsDetail>(cacheKey);

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
      const response: MobileApiResponse<MobileNewsDetail> = {
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

    // Get news detail from service
    const news = await newsService.getNewsDetail(slug);

    if (!news) {
      const response: MobileApiResponse<null> = {
        success: false,
        data: null,
        error: 'Haber bulunamadı'
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Cache the result
    const entry = cacheManager.set(cacheKey, news, CACHE_TTL);

    // Prepare response
    const response: MobileApiResponse<MobileNewsDetail> = {
      success: true,
      data: news,
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
    console.error('Error in mobile news detail endpoint:', error);

    const response: MobileApiResponse<null> = {
      success: false,
      data: null,
      error: 'Haber detayı yüklenirken bir hata oluştu'
    };

    return NextResponse.json(response, { status: 500 });
  }
}