import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { testStreamConnection } from '@/lib/db/queries/radioSettings';
import { streamTestRateLimit, addRateLimitHeaders, createRateLimitResponse } from '@/lib/middleware/rateLimit';
import { getCurrentSong } from '@/lib/utils/streamMetadata';

/**
 * POST /api/admin/settings/radio/test
 * Test radio stream connection endpoint with metadata extraction
 * Requirement 2.3: Test button attempts connection to stream and displays status
 * Requirement 2.4: Display success feedback with connection details
 * Requirement 4.1: Extract metadata when stream test succeeds
 * Requirement 4.2: Display stream title, bitrate, audio format, server information
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

      // Extract metadata when stream test succeeds (Requirements 4.1, 4.2)
      let metadata = null;
      let metadataError = null;

      try {
        // Extract metadata with a short timeout to avoid delaying the response
        // Use remaining time from 10-second limit, minimum 3 seconds for metadata
        const remainingTime = Math.max(3000, 10000 - (testResult.responseTime || 0));
        const metadataResult = await getCurrentSong(streamUrl, remainingTime);

        if (metadataResult.success && metadataResult.metadata) {
          metadata = metadataResult.metadata;
        } else {
          metadataError = metadataResult.error;
        }
      } catch (error) {
        // Don't fail the entire request if metadata extraction fails
        metadataError = error instanceof Error ? error.message : 'Metadata extraction failed';
        console.warn('Metadata extraction failed:', metadataError);
      }

      const response = NextResponse.json({
        success: true,
        status: 'success',
        message: 'Stream connection successful',
        details: {
          statusCode: testResult.statusCode,
          responseTime: testResult.responseTime,
          contentType: testResult.contentType
        },
        // Include metadata in response if available (Requirements 4.1, 4.2)
        metadata: metadata || undefined,
        // Include metadata error for debugging if extraction failed
        metadataError: metadataError || undefined
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