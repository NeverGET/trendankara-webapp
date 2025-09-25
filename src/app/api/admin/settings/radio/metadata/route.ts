import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getCurrentSong } from '@/lib/utils/streamMetadata';
import { createRateLimit, addRateLimitHeaders, createRateLimitResponse } from '@/lib/middleware/rateLimit';

/**
 * Metadata update endpoint rate limiter - 20 requests per minute per user
 * Higher limit than stream test since metadata updates are lightweight
 */
const metadataRateLimit = createRateLimit({
  maxRequests: 20,
  windowMs: 60 * 1000, // 1 minute
  keyGenerator: (request: NextRequest) => {
    // Use session-based key if available, fallback to IP
    const sessionId = request.headers.get('x-session-id') ||
                     request.headers.get('authorization')?.slice(0, 20) ||
                     request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    return `metadata-update:${sessionId}`;
  },
  onLimitReached: (request: NextRequest) => {
    console.warn('Metadata update rate limit exceeded', {
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/admin/settings/radio/metadata
 * Real-time metadata update endpoint for preview sessions
 * Requirement 4.3: Update metadata dynamically during sessions
 * Requirement 4.4: Refresh metadata during preview sessions without blocking UI
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting - 20 metadata requests per minute per user
    const rateLimitResult = metadataRateLimit.check(request);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.retryAfter || 60);
    }

    // Check authentication
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json(
        {
          error: 'Yetkisiz erişim',
          message: 'Bu işlem için giriş yapmanız gerekiyor'
        },
        { status: 401 }
      );
    }

    // Check admin role for metadata access
    const userRole = session.user?.role;
    if (!userRole || !['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json(
        {
          error: 'Yetersiz yetki',
          message: 'Bu işlem için admin yetkisi gerekiyor'
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { streamUrl, timeout = 5000 } = body;

    // Validate stream URL is provided
    if (!streamUrl || typeof streamUrl !== 'string') {
      return NextResponse.json(
        {
          error: 'Geçersiz URL',
          message: 'Stream URL alanı zorunludur'
        },
        { status: 400 }
      );
    }

    // Validate timeout parameter
    const timeoutMs = Math.min(Math.max(timeout, 1000), 10000); // 1-10 seconds

    // Extract metadata with shorter timeout for real-time updates
    const metadataResult = await getCurrentSong(streamUrl, timeoutMs);

    if (metadataResult.success && metadataResult.metadata) {
      // Mark as successful request for rate limiting
      metadataRateLimit.onSuccess(request);

      const response = NextResponse.json({
        success: true,
        message: 'Metadata başarıyla alındı',
        metadata: metadataResult.metadata,
        responseTime: metadataResult.responseTime,
        timestamp: new Date().toISOString()
      });

      return addRateLimitHeaders(response, rateLimitResult);
    } else {
      // Return error but don't count against rate limit for failed extractions
      const response = NextResponse.json({
        success: false,
        error: 'Metadata alınamadı',
        message: metadataResult.error || 'Stream metadata bilgisi alınamadı',
        responseTime: metadataResult.responseTime,
        timestamp: new Date().toISOString()
      }, { status: 422 });

      return addRateLimitHeaders(response, rateLimitResult);
    }

  } catch (error) {
    console.error('Metadata update error:', error);

    // Handle timeout and other errors with Turkish messages
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          error: 'Zaman aşımı',
          message: 'Metadata alma işlemi zaman aşımına uğradı'
        }, { status: 408 });
      }

      if (error.message.includes('network') || error instanceof TypeError) {
        return NextResponse.json({
          success: false,
          error: 'Ağ hatası',
          message: 'Stream sunucusuna bağlanılamadı'
        }, { status: 503 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Sunucu hatası',
      message: 'Metadata alma işleminde bir hata oluştu'
    }, { status: 500 });
  }
}