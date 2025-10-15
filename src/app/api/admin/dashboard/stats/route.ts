import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getDashboardStats } from '@/lib/services/dashboard';

/**
 * GET /api/admin/dashboard/stats
 *
 * Returns dashboard statistics for admin panel
 * Uses shared service function for consistency with server component
 *
 * @returns Dashboard statistics object
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use shared service function
    const stats = await getDashboardStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}