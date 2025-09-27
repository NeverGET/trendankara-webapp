/**
 * Single Card API Route
 * GET /api/mobile/v1/content/cards/[id]
 * Returns a specific card by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { CardService } from '@/services/mobile/CardService';
import { MobileErrorHandler } from '@/lib/mobile/MobileErrorHandler';

const cardService = new CardService();

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = await context.params;
    const cardId = parseInt(id, 10);

    if (isNaN(cardId)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Geçersiz kart ID'
        },
        { status: 400 }
      );
    }

    const card = await cardService.getCardById(cardId);

    if (!card) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Kart bulunamadı'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: card
    });

  } catch (error) {
    return MobileErrorHandler.handle(error, 'Kart bilgisi alınamadı');
  }
}