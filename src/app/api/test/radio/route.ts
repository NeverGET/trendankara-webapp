import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test fetching radio stats directly
    const response = await fetch('https://radyo.yayin.com.tr:5132/stats?json=1', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      raw: data,
      formatted: {
        currentListeners: data.currentlisteners || 0,
        peakListeners: data.peaklisteners || 0,
        uniqueListeners: data.uniquelisteners || 0,
        streamStatus: data.streamstatus === 1,
        songTitle: data.songtitle || 'Bilgi yok',
        serverTitle: data.servertitle || 'Radyo',
        bitrate: data.bitrate || '128',
        uptime: data.streamuptime || 0,
        uptimeFormatted: formatUptime(data.streamuptime || 0)
      }
    });
  } catch (error) {
    console.error('Radio test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days} gün ${hours} saat`;
  } else if (hours > 0) {
    return `${hours} saat ${minutes} dakika`;
  } else {
    return `${minutes} dakika`;
  }
}