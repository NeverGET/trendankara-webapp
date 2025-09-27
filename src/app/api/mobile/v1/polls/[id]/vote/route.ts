/**
 * Mobile Poll Voting API Endpoint
 * Handles vote submission with device tracking
 * Requirements: 1.1 - Poll voting with device validation
 */

import { NextRequest, NextResponse } from 'next/server';
import type { MobileApiResponse, DeviceInfo, VoteResult } from '@/types/mobile';
import pollService from '@/services/mobile/PollService';
import cacheManager from '@/lib/cache/MobileCacheManager';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve params (Next.js 15 async params)
    const resolvedParams = await params;
    const pollId = parseInt(resolvedParams.id);

    if (isNaN(pollId)) {
      const response: MobileApiResponse<null> = {
        success: false,
        data: null,
        error: 'Geçersiz anket ID'
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { itemId, deviceInfo } = body;

    // Validate required fields
    if (!itemId || !deviceInfo || !deviceInfo.deviceId) {
      const response: MobileApiResponse<null> = {
        success: false,
        data: null,
        error: 'Eksik bilgi: itemId ve deviceInfo gerekli'
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Get IP address from headers
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown';

    // Create device info object
    const device: DeviceInfo = {
      deviceId: deviceInfo.deviceId,
      platform: deviceInfo.platform,
      appVersion: deviceInfo.appVersion,
      userAgent: deviceInfo.userAgent || request.headers.get('user-agent') || 'mobile-app'
    };

    // Submit vote through service
    const result = await pollService.submitVote(
      pollId,
      itemId,
      device,
      ipAddress
    );

    // Clear poll cache on successful vote
    if (result.success) {
      cacheManager.invalidate('mobile:polls:*');
    }

    // Prepare response
    const response: MobileApiResponse<VoteResult> = {
      success: result.success,
      data: result,
      error: result.success ? undefined : result.message
    };

    // Return response with appropriate status
    return NextResponse.json(response, {
      status: result.success ? 200 : 400
    });
  } catch (error) {
    console.error('Error in mobile poll voting endpoint:', error);

    const response: MobileApiResponse<null> = {
      success: false,
      data: null,
      error: 'Oy gönderilirken bir hata oluştu'
    };

    return NextResponse.json(response, { status: 500 });
  }
}