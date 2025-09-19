import { NextResponse } from 'next/server';

interface RadioStats {
  currentListeners: number;
  peakListeners: number;
  maxListeners: number;
  uniqueListeners: number;
  averageTime: number;
  songTitle: string;
  streamStatus: boolean;
  streamUptime: number;
  bitrate: string;
}

export async function GET() {
  try {
    // Try JSON endpoint first (most reliable)
    const jsonUrl = 'https://radyo.yayin.com.tr:5132/stats?json=1';

    const response = await fetch(jsonUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 30 } // Cache for 30 seconds
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Transform the data to our format
    const stats: RadioStats = {
      currentListeners: data.currentlisteners || 0,
      peakListeners: data.peaklisteners || 0,
      maxListeners: data.maxlisteners || 0,
      uniqueListeners: data.uniquelisteners || 0,
      averageTime: data.averagetime || 0,
      songTitle: data.songtitle || 'Bilgi yok',
      streamStatus: data.streamstatus === 1,
      streamUptime: data.streamuptime || 0,
      bitrate: data.bitrate || '128'
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching radio stats:', error);

    // Fallback to parsing the simple 7.html format
    try {
      const fallbackUrl = 'https://radyo.yayin.com.tr:5132/7.html';
      const response = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        next: { revalidate: 30 }
      });

      if (!response.ok) {
        throw new Error(`Fallback failed with status: ${response.status}`);
      }

      const text = await response.text();
      // Parse format: <html><body>currentListeners,status,peakListeners,maxListeners,uniqueListeners,bitrate,songTitle</body></html>
      const match = text.match(/<body>([^<]+)<\/body>/);

      if (match) {
        const parts = match[1].split(',');
        const stats: RadioStats = {
          currentListeners: parseInt(parts[0]) || 0,
          peakListeners: parseInt(parts[2]) || 0,
          maxListeners: parseInt(parts[3]) || 0,
          uniqueListeners: parseInt(parts[4]) || 0,
          averageTime: 0,
          songTitle: parts[6] || 'Bilgi yok',
          streamStatus: parts[1] === '1',
          streamUptime: 0,
          bitrate: parts[5] || '128'
        };

        return NextResponse.json({
          success: true,
          data: stats,
          source: 'fallback'
        });
      }
    } catch (fallbackError) {
      console.error('Fallback method also failed:', fallbackError);
    }

    // Return default values if all methods fail
    return NextResponse.json({
      success: false,
      error: 'Radyo istatistikleri alınamadı',
      data: {
        currentListeners: 0,
        peakListeners: 0,
        maxListeners: 0,
        uniqueListeners: 0,
        averageTime: 0,
        songTitle: 'Bilgi yok',
        streamStatus: false,
        streamUptime: 0,
        bitrate: '128'
      }
    });
  }
}