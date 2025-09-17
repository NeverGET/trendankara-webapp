import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Try multiple endpoints to get the most accurate metadata

    // First try the stats endpoint which gives XML with more info
    try {
      const statsResponse = await fetch('https://radyo.yayin.com.tr:5132/stats?sid=1', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/xml, text/xml, */*'
        },
        cache: 'no-store'
      });

      if (statsResponse.ok) {
        const xmlText = await statsResponse.text();

        // Parse the XML to extract song title and other info
        const songMatch = xmlText.match(/<SONGTITLE>(.*?)<\/SONGTITLE>/);
        const listenersMatch = xmlText.match(/<CURRENTLISTENERS>(.*?)<\/CURRENTLISTENERS>/);
        const bitrateMatch = xmlText.match(/<BITRATE>(.*?)<\/BITRATE>/);
        const serverTitleMatch = xmlText.match(/<SERVERTITLE>(.*?)<\/SERVERTITLE>/);

        let currentSong = songMatch ? songMatch[1] : null;
        const currentListeners = listenersMatch ? parseInt(listenersMatch[1]) : 0;
        const bitrate = bitrateMatch ? bitrateMatch[1] : '128';
        const serverTitle = serverTitleMatch ? serverTitleMatch[1] : 'Trend Ankara Radio';

        // Return the actual song text, even if it's placeholder
        // The component will handle showing appropriate text
        if (!currentSong || currentSong === '') {
          currentSong = 'Now Playing info goes here';
        }

        return NextResponse.json({
          currentSong,
          currentListeners,
          bitrate,
          serverTitle,
          timestamp: new Date().toISOString()
        }, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      }
    } catch (xmlError) {
      console.error('XML endpoint error:', xmlError);
    }

    // Fallback to 7.html endpoint
    try {
      const htmlResponse = await fetch('https://radyo.yayin.com.tr:5132/7.html', {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'text/html, text/plain, */*'
        },
        cache: 'no-store'
      });

      if (htmlResponse.ok) {
        const htmlText = await htmlResponse.text();
        // Parse CSV format: listeners,status,peak,max,unique,bitrate,songtitle
        const match = htmlText.match(/<body>(.*?)<\/body>/);
        if (match) {
          const parts = match[1].split(',');
          if (parts.length >= 7) {
            const currentSong = parts[6] || 'Now Playing info goes here';

            return NextResponse.json({
              currentSong,
              currentListeners: parseInt(parts[0]) || 0,
              bitrate: parts[5] || '128',
              serverTitle: 'Trend Ankara Radio',
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    } catch (htmlError) {
      console.error('HTML endpoint error:', htmlError);
    }

    // Default response if all else fails
    return NextResponse.json({
      currentSong: 'Now Playing info goes here',
      currentListeners: 0,
      bitrate: '128',
      serverTitle: 'Trend Ankara Radio',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching radio metadata:', error);

    // Return default data on error
    return NextResponse.json({
      currentSong: 'Now Playing info goes here',
      currentListeners: 0,
      bitrate: '128',
      serverTitle: 'Trend Ankara Radio',
      timestamp: new Date().toISOString(),
      error: 'Failed to fetch metadata'
    }, {
      status: 200
    });
  }
}