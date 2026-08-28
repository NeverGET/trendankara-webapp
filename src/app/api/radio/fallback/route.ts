import { NextResponse } from 'next/server';
import { getFallbackUrl } from '@/lib/db/queries/radioSettings';
import { getRadioConfigFromEnv } from '@/lib/config/radio';

/**
 * API endpoint for radio fallback URL configuration
 * Provides fallback stream URL from environment variables or database
 * Used by RadioPlayerContext for fallback URL handling
 */
export async function GET() {
  try {
    // Get fallback URL from environment or database
    const fallbackUrl = await getFallbackUrl();

    return NextResponse.json({
      success: true,
      fallbackUrl: fallbackUrl
    });

  } catch (error) {
    console.error('Error fetching fallback URL:', error);

    // Return environment fallback even on error
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch fallback URL',
      fallbackUrl: process.env.RADIO_BACKUP_STREAM_URL || getRadioConfigFromEnv().streamUrl
    }, { status: 500 });
  }
}
