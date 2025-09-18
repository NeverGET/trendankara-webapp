import { NextRequest, NextResponse } from 'next/server';
import { authenticateWithRateLimit } from '@/lib/auth/config';
import { getClientIP } from '@/lib/auth/rate-limit';

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Auth endpoint' });
}

/**
 * Custom login endpoint with rate limiting
 * Handles rate limiting before calling NextAuth
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, action } = body;

    // Only handle login action
    if (action !== 'login') {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Extract IP address
    const ipAddress = getClientIP(request.headers);

    // Authenticate with rate limiting
    const authResult = await authenticateWithRateLimit(email, password, ipAddress);

    if (!authResult.success) {
      const status = authResult.isRateLimited ? 429 : 401;
      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
          isRateLimited: authResult.isRateLimited,
          remainingTime: authResult.remainingTime
        },
        { status }
      );
    }

    // If authentication successful, return success
    // The actual NextAuth session creation will be handled by the login form
    return NextResponse.json({
      success: true,
      message: 'Kimlik doğrulama başarılı', // Turkish: Authentication successful
      user: authResult.user
    });

  } catch (error) {
    console.error('Error in auth API:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası' }, // Turkish: Server error
      { status: 500 }
    );
  }
}
