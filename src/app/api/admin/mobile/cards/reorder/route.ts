/**
 * Admin Mobile Cards Reorder API
 * Reorder cards display order
 * Requirements: 2.6 - Card reordering
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/utils';
import { MobileCardQueries } from '@/lib/queries/mobileCardQueries';
import cacheManager from '@/lib/cache/MobileCacheManager';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { orders } = await request.json();

    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        { error: 'Geçersiz sıralama verisi' },
        { status: 400 }
      );
    }

    // Validate order data
    for (const item of orders) {
      if (typeof item.id !== 'number' || typeof item.order !== 'number') {
        return NextResponse.json(
          { error: 'Geçersiz sıralama formatı' },
          { status: 400 }
        );
      }
    }

    // Reorder cards
    await MobileCardQueries.reorder(orders);

    // Invalidate cache
    cacheManager.invalidate('mobile:cards:*');
    cacheManager.invalidate('mobile:content:*');

    return NextResponse.json({ 
      success: true,
      message: 'Kartlar başarıyla yeniden sıralandı' 
    });
  } catch (error) {
    console.error('Error reordering cards:', error);
    return NextResponse.json(
      { error: 'Kartlar yeniden sıralanırken bir hata oluştu' },
      { status: 500 }
    );
  }
}