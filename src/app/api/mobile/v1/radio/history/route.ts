/**
 * Radio History API Route
 * GET /api/mobile/v1/radio/history
 * Returns recently played songs
 */

import { NextRequest, NextResponse } from 'next/server';
import { MobileApiResponse } from '@/types/mobile';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    // Mock history data - replace with actual radio system integration
    const history = {
      songs: [
        {
          title: 'Bir Derdim Var',
          artist: 'Mor ve Ötesi',
          album: 'Dünya Yalan Söylüyor',
          artwork: '/api/media/artwork/morveotesi.jpg',
          playedAt: new Date(Date.now() - 5 * 60000).toISOString(),
          duration: 245
        },
        {
          title: 'Gidersen',
          artist: 'Duman',
          album: 'Belki Alışman Lazım',
          artwork: '/api/media/artwork/duman.jpg',
          playedAt: new Date(Date.now() - 10 * 60000).toISOString(),
          duration: 198
        },
        {
          title: 'Yalnızlık',
          artist: 'Teoman',
          album: 'En Güzel Hikayem',
          artwork: '/api/media/artwork/teoman.jpg',
          playedAt: new Date(Date.now() - 15 * 60000).toISOString(),
          duration: 267
        },
        {
          title: 'Sevdim Seni Bir Kere',
          artist: 'Cem Adrian',
          album: 'Essentials',
          artwork: '/api/media/artwork/cemadrian.jpg',
          playedAt: new Date(Date.now() - 20 * 60000).toISOString(),
          duration: 312
        },
        {
          title: 'Bu Şehir Girdap Gülüm',
          artist: 'Adamlar',
          album: 'Aya Benzer',
          artwork: '/api/media/artwork/adamlar.jpg',
          playedAt: new Date(Date.now() - 25 * 60000).toISOString(),
          duration: 195
        }
      ].slice(0, limit),
      total: limit
    };

    const response: MobileApiResponse<any> = {
      success: true,
      data: history,
      cache: {
        etag: `"history-${Date.now()}"`,
        maxAge: 60 // 1 minute
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: 'Çalma geçmişi alınamadı'
      },
      { status: 500 }
    );
  }
}