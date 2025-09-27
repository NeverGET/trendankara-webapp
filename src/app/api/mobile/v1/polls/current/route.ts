/**
 * Current Poll API Route
 * GET /api/mobile/v1/polls/current
 * Returns the most recent active poll
 */

import { NextRequest, NextResponse } from 'next/server';
import { PollService } from '@/services/mobile/PollService';
import { MobileErrorHandler } from '@/lib/mobile/MobileErrorHandler';

const pollService = new PollService();

export async function GET(request: NextRequest) {
  try {
    // Get device ID from headers for vote status
    const deviceId = request.headers.get('x-device-id') || 'anonymous';

    // Get current/latest active poll
    const poll = await pollService.getCurrentPoll(deviceId);

    if (!poll) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Aktif anket bulunamadı'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: poll
    });

  } catch (error) {
    return MobileErrorHandler.handle(error, 'Anket bilgisi alınamadı');
  }
}