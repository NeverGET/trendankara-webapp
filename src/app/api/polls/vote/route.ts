import { NextRequest, NextResponse } from 'next/server';
import { recordVote, hasVoted } from '@/lib/db/polls';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pollId, pollItemId, deviceId } = body;

    // Validate required fields
    if (!pollId || !pollItemId || !deviceId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get IP address
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check if already voted
    const alreadyVoted = await hasVoted(pollId, deviceId, ipAddress);
    if (alreadyVoted) {
      return NextResponse.json(
        { success: false, error: 'Already voted in this poll' },
        { status: 400 }
      );
    }

    // Record the vote (this also updates vote count)
    const success = await recordVote({
      pollId: Number(pollId),
      pollItemId: Number(pollItemId),
      deviceId,
      ipAddress,
      userAgent
    });

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Vote recorded successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to record vote' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in vote API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}