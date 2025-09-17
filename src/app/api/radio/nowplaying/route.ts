import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://radyo.yayin.com.tr:5132/currentsong', {
      cache: 'no-store'
    });

    if (response.ok) {
      const text = await response.text();
      return NextResponse.json({ nowPlaying: text });
    }
  } catch (error) {
    // Return empty if error
  }

  return NextResponse.json({ nowPlaying: 'Now Playing info goes here' });
}