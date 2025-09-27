/**
 * Admin Mobile Card Detail API
 * Update and delete operations for individual cards
 * Requirements: 2.4, 2.5, 2.7 - Card management operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/utils';
import { MobileCardQueries } from '@/lib/queries/mobileCardQueries';
import type { CardInput } from '@/types/mobile';
import cacheManager from '@/lib/cache/MobileCacheManager';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve params (Next.js 15 async params)
    const resolvedParams = await params;
    const cardId = parseInt(resolvedParams.id);

    if (isNaN(cardId)) {
      return NextResponse.json(
        { error: 'Geçersiz kart ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const data: Partial<CardInput> = await request.json();

    // Update card
    const success = await MobileCardQueries.update(cardId, data);

    if (!success) {
      return NextResponse.json(
        { error: 'Kart bulunamadı veya güncellenemedi' },
        { status: 404 }
      );
    }

    // Invalidate cache
    cacheManager.invalidate('mobile:cards:*');
    cacheManager.invalidate('mobile:content:*');

    return NextResponse.json({ 
      success: true,
      message: 'Kart başarıyla güncellendi' 
    });
  } catch (error) {
    console.error('Error updating card:', error);
    return NextResponse.json(
      { error: 'Kart güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve params (Next.js 15 async params)
    const resolvedParams = await params;
    const cardId = parseInt(resolvedParams.id);

    if (isNaN(cardId)) {
      return NextResponse.json(
        { error: 'Geçersiz kart ID' },
        { status: 400 }
      );
    }

    // Parse request body (partial update)
    const data = await request.json();

    // Update only the provided fields
    const success = await MobileCardQueries.update(cardId, data);

    if (!success) {
      return NextResponse.json(
        { error: 'Kart bulunamadı veya güncellenemedi' },
        { status: 404 }
      );
    }

    // Invalidate cache
    cacheManager.invalidate('mobile:cards:*');
    cacheManager.invalidate('mobile:content:*');

    return NextResponse.json({ 
      success: true,
      message: 'Kart durumu güncellendi' 
    });
  } catch (error) {
    console.error('Error patching card:', error);
    return NextResponse.json(
      { error: 'Kart güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve params (Next.js 15 async params)
    const resolvedParams = await params;
    const cardId = parseInt(resolvedParams.id);

    if (isNaN(cardId)) {
      return NextResponse.json(
        { error: 'Geçersiz kart ID' },
        { status: 400 }
      );
    }

    // Soft delete card
    const success = await MobileCardQueries.softDelete(cardId);

    if (!success) {
      return NextResponse.json(
        { error: 'Kart bulunamadı veya silinemedi' },
        { status: 404 }
      );
    }

    // Invalidate cache
    cacheManager.invalidate('mobile:cards:*');
    cacheManager.invalidate('mobile:content:*');

    return NextResponse.json({ 
      success: true,
      message: 'Kart başarıyla silindi' 
    });
  } catch (error) {
    console.error('Error deleting card:', error);
    return NextResponse.json(
      { error: 'Kart silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
}