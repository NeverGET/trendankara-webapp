import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { testStreamConnection } from '@/lib/db/queries/radioSettings';
import { streamTestRateLimit, addRateLimitHeaders, createRateLimitResponse } from '@/lib/middleware/rateLimit';

/**
 * POST /api/admin/settings/radio/test
 * Test radio stream connection endpoint
 * Requirement 2.3: Test button attempts connection to stream and displays status
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting - 10 tests per minute per user
    const rateLimitResult = streamTestRateLimit.check(request);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.retryAfter || 60);
    }

    // Check authentication
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role for test access
    const userRole = session.user?.role;
    if (!userRole || !['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin access required.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { streamUrl } = body;

    // Validate stream URL is provided
    if (!streamUrl || typeof streamUrl !== 'string') {
      return NextResponse.json(
        { error: 'Stream URL is required' },
        { status: 400 }
      );
    }

    // Test the stream connection with 10-second timeout handling
    const testResult = await testStreamConnection(streamUrl);

    // Return success/failure status with details
    if (testResult.isValid) {
      // Mark as successful request for rate limiting
      streamTestRateLimit.onSuccess(request);

      const response = NextResponse.json({
        success: true,
        status: 'success',
        message: 'Stream connection successful',
        details: {
          statusCode: testResult.statusCode,
          responseTime: testResult.responseTime,
          contentType: testResult.contentType
        }
      });

      return addRateLimitHeaders(response, rateLimitResult);
    } else {
      const response = NextResponse.json({
        success: false,
        status: 'failure',
        message: 'Stream connection failed',
        error: testResult.error,
        details: {
          statusCode: testResult.statusCode,
          responseTime: testResult.responseTime,
          contentType: testResult.contentType
        }
      });

      return addRateLimitHeaders(response, rateLimitResult);
    }

  } catch (error) {
    console.error('Stream test error:', error);

    // Handle timeout and other errors
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          status: 'failure',
          message: 'Stream connection test timed out',
          error: 'Connection timeout (10 seconds exceeded)'
        }, { status: 408 });
      }
    }

    return NextResponse.json({
      success: false,
      status: 'failure',
      message: 'Stream connection test failed',
      error: 'Internal server error'
    }, { status: 500 });
  }
}