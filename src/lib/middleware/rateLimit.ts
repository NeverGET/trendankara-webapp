import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
  onLimitReached?: (request: NextRequest) => void;
}

// In-memory store for rate limiting
// In production, this should use Redis or similar persistent storage
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup function to remove expired entries
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Rate limiting middleware for API endpoints
 */
export function createRateLimit(options: RateLimitOptions) {
  const {
    maxRequests,
    windowMs,
    skipSuccessfulRequests = false,
    keyGenerator = (request: NextRequest) => {
      // Default: use IP address and user agent
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                 request.headers.get('x-real-ip') ||
                 request.headers.get('cf-connecting-ip') ||
                 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      return `${ip}:${userAgent.slice(0, 50)}`;
    },
    onLimitReached
  } = options;

  return {
    check: (request: NextRequest): {
      allowed: boolean;
      remaining: number;
      resetTime: number;
      retryAfter?: number;
    } => {
      const key = keyGenerator(request);
      const now = Date.now();
      const resetTime = now + windowMs;

      let entry = rateLimitStore.get(key);

      // Create new entry if doesn't exist or if window has expired
      if (!entry || now > entry.resetTime) {
        entry = {
          count: 0,
          resetTime,
          blocked: false
        };
        rateLimitStore.set(key, entry);
      }

      // Check if blocked
      if (entry.blocked && now < entry.resetTime) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: entry.resetTime,
          retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        };
      }

      // Increment count
      entry.count++;

      // Check if limit exceeded
      if (entry.count > maxRequests) {
        entry.blocked = true;

        // Call callback if provided
        if (onLimitReached) {
          onLimitReached(request);
        }

        return {
          allowed: false,
          remaining: 0,
          resetTime: entry.resetTime,
          retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        };
      }

      return {
        allowed: true,
        remaining: Math.max(0, maxRequests - entry.count),
        resetTime: entry.resetTime
      };
    },

    onSuccess: (request: NextRequest): void => {
      if (skipSuccessfulRequests) {
        const key = keyGenerator(request);
        const entry = rateLimitStore.get(key);
        if (entry && entry.count > 0) {
          entry.count--;
        }
      }
    }
  };
}

/**
 * Stream test endpoint rate limiter - 10 tests per minute per user
 */
export const streamTestRateLimit = createRateLimit({
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
  keyGenerator: (request: NextRequest) => {
    // Use session-based key if available, fallback to IP
    const sessionId = request.headers.get('x-session-id') ||
                     request.headers.get('authorization')?.slice(0, 20) ||
                     request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    return `stream-test:${sessionId}`;
  },
  onLimitReached: (request: NextRequest) => {
    console.warn('Stream test rate limit exceeded', {
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * General API rate limiter - 100 requests per minute per user
 */
export const generalApiRateLimit = createRateLimit({
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  skipSuccessfulRequests: true,
  onLimitReached: (request: NextRequest) => {
    console.warn('General API rate limit exceeded', {
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown',
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Utility function to add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  rateLimitResult: { remaining: number; resetTime: number; retryAfter?: number }
): NextResponse {
  response.headers.set('X-RateLimit-Limit', '10');
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString());

  if (rateLimitResult.retryAfter) {
    response.headers.set('Retry-After', rateLimitResult.retryAfter.toString());
  }

  return response;
}

/**
 * Create rate limit exceeded response
 */
export function createRateLimitResponse(retryAfter: number): NextResponse {
  const response = NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: retryAfter
    },
    { status: 429 }
  );

  response.headers.set('Retry-After', retryAfter.toString());
  response.headers.set('X-RateLimit-Limit', '10');
  response.headers.set('X-RateLimit-Remaining', '0');

  return response;
}