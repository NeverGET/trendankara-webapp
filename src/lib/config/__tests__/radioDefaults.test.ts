import {
  RADIO_DEFAULT_METADATA_URL,
  RADIO_DEFAULT_STREAM_URL,
  describeAzuracastUrl,
  deriveRadioEndpoints,
  detectRadioProvider,
  isSelfReferentialRadioUrl,
} from '@/lib/config/radioDefaults';

describe('describeAzuracastUrl', () => {
  it('recognises a /listen/<shortcode>/<mount> stream URL', () => {
    expect(describeAzuracastUrl('https://stream.netradyom.com/listen/trendradyo/radio.mp3')).toEqual({
      origin: 'https://stream.netradyom.com',
      shortcode: 'trendradyo',
      nowPlayingUrl: 'https://stream.netradyom.com/api/nowplaying/trendradyo',
      nowPlayingStaticUrl: 'https://stream.netradyom.com/api/nowplaying_static/trendradyo.json',
      nowPlayingUrls: [
        'https://stream.netradyom.com/api/nowplaying_static/trendradyo.json',
        'https://stream.netradyom.com/api/nowplaying/trendradyo',
      ],
      mountBaseUrl: 'https://stream.netradyom.com/listen/trendradyo/',
    });
  });

  it('recognises an /api/nowplaying/<shortcode> metadata URL', () => {
    expect(
      describeAzuracastUrl('https://stream.netradyom.com/api/nowplaying/trendradyo')?.shortcode
    ).toBe('trendradyo');
  });

  it('recognises an /api/nowplaying_static/<shortcode>.json URL and strips .json', () => {
    expect(
      describeAzuracastUrl('https://stream.netradyom.com/api/nowplaying_static/trendradyo.json')
        ?.shortcode
    ).toBe('trendradyo');
  });

  describe('does not misread Shoutcast/Icecast URLs', () => {
    it.each([
      // The old Shoutcast station.
      'https://radyo.yayin.com.tr:5132/stream',
      'https://radyo.yayin.com.tr:5132/',
      // A bare Icecast `/listen` mount — one segment, so not AzuraCast.
      'https://stream.radyotrendankara.com/listen',
      // Two segments is still not the AzuraCast `/listen/<sc>/<mount>` shape.
      'https://stream.radyotrendankara.com/listen/stream',
      // The SSE endpoint is deliberately unsupported.
      'https://stream.netradyom.com/api/live/nowplaying/sse',
      // Junk.
      'not-a-url',
      'ftp://stream.netradyom.com/listen/trendradyo/radio.mp3',
      '',
    ])('returns null for %s', (url) => {
      expect(describeAzuracastUrl(url)).toBeNull();
    });
  });
});

describe('detectRadioProvider', () => {
  it('detects AzuraCast from the stream URL alone', () => {
    expect(
      detectRadioProvider({ streamUrl: 'https://stream.netradyom.com/listen/trendradyo/radio.mp3' })
    ).toBe('azuracast');
  });

  it('lets an explicit AzuraCast metadata URL win over a plain stream URL', () => {
    expect(
      detectRadioProvider({
        streamUrl: 'https://relay.example.com/stream',
        metadataUrl: 'https://stream.netradyom.com/api/nowplaying/trendradyo',
      })
    ).toBe('azuracast');
  });

  it('falls back to shoutcast', () => {
    expect(detectRadioProvider({ streamUrl: 'https://radyo.yayin.com.tr:5132/stream' })).toBe(
      'shoutcast'
    );
    expect(detectRadioProvider({})).toBe('azuracast'); // the new default station
  });
});

describe('deriveRadioEndpoints', () => {
  it('derives the AzuraCast probe chain and a usable mount base', () => {
    const endpoints = deriveRadioEndpoints({
      streamUrl: 'https://stream.netradyom.com/listen/trendradyo/radio.mp3',
    });

    expect(endpoints.provider).toBe('azuracast');
    expect(endpoints.azuracastShortcode).toBe('trendradyo');
    expect(endpoints.nowPlayingStaticApiUrl).toBe(
      'https://stream.netradyom.com/api/nowplaying_static/trendradyo.json'
    );
    expect(endpoints.nowPlayingApiUrl).toBe('https://stream.netradyom.com/api/nowplaying/trendradyo');
    // Static file is probed first.
    expect(endpoints.nowPlayingApiUrls[0]).toContain('nowplaying_static');
    expect(endpoints.metadataBaseUrl).toBe('https://stream.netradyom.com/listen/trendradyo/');
  });

  it('leaves the Shoutcast derivation exactly as it was', () => {
    const endpoints = deriveRadioEndpoints({
      streamUrl: 'https://radyo.yayin.com.tr:5132/stream',
    });

    expect(endpoints.provider).toBe('shoutcast');
    expect(endpoints.azuracastShortcode).toBeNull();
    expect(endpoints.nowPlayingApiUrl).toBeNull();
    expect(endpoints.nowPlayingApiUrls).toEqual([]);
    expect(endpoints.metadataBaseUrl).toBe('https://radyo.yayin.com.tr:5132/');
    expect(endpoints.currentSongUrl).toBe('https://radyo.yayin.com.tr:5132/currentsong');
    expect(endpoints.statsXmlUrl).toBe('https://radyo.yayin.com.tr:5132/stats?sid=1');
    expect(endpoints.statsJsonUrl).toBe('https://radyo.yayin.com.tr:5132/stats?json=1');
    expect(endpoints.legacyStatsUrl).toBe('https://radyo.yayin.com.tr:5132/7.html');
  });

  it('ships AzuraCast defaults so a fresh install with an empty DB works', () => {
    expect(RADIO_DEFAULT_STREAM_URL).toBe(
      'https://stream.netradyom.com/listen/trendradyo/radio.mp3'
    );
    expect(RADIO_DEFAULT_METADATA_URL).toBe(
      'https://stream.netradyom.com/api/nowplaying/trendradyo'
    );

    const endpoints = deriveRadioEndpoints({});
    expect(endpoints.provider).toBe('azuracast');
    expect(endpoints.azuracastShortcode).toBe('trendradyo');
  });
});

describe('self-reference guard', () => {
  // `/api/radio/stream` and `/api/radio/currentsong` are served by THIS app so
  // the published mobile app keeps working without a store release. An operator
  // storing one of them in `radio_settings` must not produce a fetch loop.
  it.each([
    'https://trendankara.com/api/radio/stream',
    'https://trendankara.com/api/radio/currentsong',
    'http://localhost:3050/api/radio/stream/',
    'https://trendankara.com/API/RADIO/STREAM',
  ])('flags %s as self-referential', (url) => {
    expect(isSelfReferentialRadioUrl(url)).toBe(true);
  });

  it.each([
    'https://stream.netradyom.com/listen/trendradyo/radio.mp3',
    'https://radyo.yayin.com.tr:5132/stream',
    'https://trendankara.com/api/mobile/v1/radio',
    'not-a-url',
    '',
  ])('does not flag %s', (url) => {
    expect(isSelfReferentialRadioUrl(url)).toBe(false);
  });

  it('never derives metadata endpoints from our own redirect route', () => {
    const endpoints = deriveRadioEndpoints({
      streamUrl: 'https://trendankara.com/api/radio/stream',
    });

    // The player still gets the configured URL...
    expect(endpoints.streamUrl).toBe('https://trendankara.com/api/radio/stream');
    // ...but metadata falls back to the real upstream, NOT /api/radio/currentsong.
    expect(endpoints.provider).toBe('azuracast');
    expect(endpoints.currentSongUrl).not.toContain('/api/radio/');
    expect(endpoints.nowPlayingApiUrls[0]).toContain('stream.netradyom.com');
  });

  it('still honours a real metadata URL alongside the redirect stream URL', () => {
    const endpoints = deriveRadioEndpoints({
      streamUrl: 'https://trendankara.com/api/radio/stream',
      metadataUrl: 'https://radyo.yayin.com.tr:5132/',
    });

    expect(endpoints.provider).toBe('shoutcast');
    expect(endpoints.currentSongUrl).toBe('https://radyo.yayin.com.tr:5132/currentsong');
  });
});
