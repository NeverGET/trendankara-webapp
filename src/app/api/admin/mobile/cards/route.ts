/**
 * Admin Mobile Cards API
 * CRUD operations for mobile cards
 * Requirements: 2.1, 2.4, 2.5 - Card management API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/utils';
import { MobileCardQueries } from '@/lib/queries/mobileCardQueries';
import type { CardInput } from '@/types/mobile';
import cacheManager from '@/lib/cache/MobileCacheManager';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get cards from database
    const cards = await MobileCardQueries.getAllActive();

    return NextResponse.json({ cards });
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json(
      { error: 'Kartlar yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const data: CardInput = await request.json();

    // Validate required fields
    if (!data.title) {
      return NextResponse.json(
        { error: 'Başlık gerekli' },
        { status: 400 }
      );
    }

    // Create card
    const cardId = await MobileCardQueries.create(data, (session.user as any)?.id || 1);

    // Invalidate cache
    cacheManager.invalidate('mobile:cards:*');
    cacheManager.invalidate('mobile:content:*');

    return NextResponse.json({ 
      success: true, 
      cardId,
      message: 'Kart başarıyla oluşturuldu' 
    });
  } catch (error) {
    console.error('Error creating card:', error);
    return NextResponse.json(
      { error: 'Kart oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}