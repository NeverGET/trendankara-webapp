import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { cleanupExpiredSessions } from '@/lib/db/auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    if (session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Call the cleanup function
    const deletedCount = await cleanupExpiredSessions();

    // Return cleanup statistics
    return NextResponse.json({
      success: true,
      message: 'Oturum temizleme işlemi başarıyla tamamlandı', // Turkish: Session cleanup completed successfully
      statistics: {
        deletedSessions: deletedCount,
        cleanupTimestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Session cleanup error:', error);
    return NextResponse.json(
      {
        error: 'Oturum temizleme işlemi sırasında bir hata oluştu', // Turkish: An error occurred during session cleanup
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}