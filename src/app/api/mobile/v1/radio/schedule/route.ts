/**
 * Radio Schedule API Route
 * GET /api/mobile/v1/radio/schedule
 * Returns the radio program schedule
 */

import { NextRequest, NextResponse } from 'next/server';
import { MobileApiResponse } from '@/types/mobile';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const day = searchParams.get('day') || new Date().toISOString().split('T')[0];
    const week = searchParams.get('week') === 'true';

    // Mock schedule data - replace with actual database query
    const schedule = {
      day: day,
      date: new Date().toISOString().split('T')[0],
      programs: [
        {
          id: 1,
          name: 'Günaydın Ankara',
          presenter: 'Ali Yılmaz',
          description: 'Güne enerjik başlamak için en güzel şarkılar',
          startTime: '07:00',
          endTime: '10:00',
          imageUrl: '/api/media/programs/gunaydin.jpg',
          isLive: false,
          isRepeat: false
        },
        {
          id: 2,
          name: 'Öğle Keyfi',
          presenter: 'Ayşe Demir',
          description: 'Öğle arasında dinlendiren müzikler',
          startTime: '12:00',
          endTime: '14:00',
          imageUrl: '/api/media/programs/ogle.jpg',
          isLive: true,
          isRepeat: false
        },
        {
          id: 3,
          name: 'Akşam Esintileri',
          presenter: 'Mehmet Öz',
          description: 'Akşam saatlerinde huzur veren melodiler',
          startTime: '18:00',
          endTime: '20:00',
          imageUrl: '/api/media/programs/aksam.jpg',
          isLive: false,
          isRepeat: false
        },
        {
          id: 4,
          name: 'Gece Yolcuları',
          presenter: 'Zeynep Kaya',
          description: 'Gece için özel seçilmiş şarkılar',
          startTime: '22:00',
          endTime: '01:00',
          imageUrl: '/api/media/programs/gece.jpg',
          isLive: false,
          isRepeat: false
        }
      ]
    };

    const response: MobileApiResponse<any> = {
      success: true,
      data: schedule,
      cache: {
        etag: `"schedule-${day}-${Date.now()}"`,
        maxAge: 3600 // 1 hour
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: 'Program bilgisi alınamadı'
      },
      { status: 500 }
    );
  }
}