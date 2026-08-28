import {
  classifyAzuracastEndpoint,
  isAzuracastNowPlayingPayload,
  normalizeAzuracastNowPlaying,
  splitArtistTitle,
  type AzuracastNowPlayingPayload,
} from '@/lib/utils/azuracast';

/** Trimmed copy of a real response from /api/nowplaying/trendradyo. */
const LIVE_PAYLOAD: AzuracastNowPlayingPayload = {
  station: {
    name: 'trendradyo',
    shortcode: 'trendradyo',
    listen_url: 'https://stream.netradyom.com/listen/trendradyo/radio.mp3',
    mounts: [
      {
        name: '/radio.mp3 (192kbps MP3)',
        url: 'https://stream.netradyom.com/listen/trendradyo/radio.mp3',
        bitrate: 192,
        format: 'mp3',
      },
    ],
  },
  listeners: { total: 2, unique: 1, current: 2 },
  now_playing: {
    song: {
      text: 'SÝNCAN OTURAK ALEMÝ - SAÇLARINI ÖREMEDÝM - EKREM ÖZEL',
      artist: 'SÝNCAN OTURAK ALEMÝ ',
      title: ' SAÇLARINI ÖREMEDÝM - EKREM ÖZEL',
      album: '',
      art: 'https://stream.netradyom.com/static/generic_song.jpg',
    },
    duration: 0,
    elapsed: 17,
  },
  playing_next: null,
  song_history: [
    { song: { text: 'KAZANLI MESUT - BABA SON DURAÐIM U.H.' } },
    { song: { text: 'OÐUZ YILMAZ - SEHER YILDIZI' } },
    { song: { text: 'SÝNCANLI HÜSEYÝN DEMÝRBÝLEK - GAMLI FELEK' } },
  ],
  is_online: true,
};

describe('normalizeAzuracastNowPlaying', () => {
  const result = normalizeAzuracastNowPlaying(LIVE_PAYLOAD);

  it('repairs Turkish in the composed song line', () => {
    expect(result.currentSong).toBe('SİNCAN OTURAK ALEMİ - SAÇLARINI ÖREMEDİM - EKREM ÖZEL');
  });

  it('repairs Turkish in artist and title separately', () => {
    expect(result.artist).toBe('SİNCAN OTURAK ALEMİ');
    expect(result.title).toBe('SAÇLARINI ÖREMEDİM - EKREM ÖZEL');
  });

  it('repairs Turkish in the song history', () => {
    expect(result.songHistory).toEqual([
      'KAZANLI MESUT - BABA SON DURAĞIM U.H.',
      'OĞUZ YILMAZ - SEHER YILDIZI',
      'SİNCANLI HÜSEYİN DEMİRBİLEK - GAMLI FELEK',
    ]);
  });

  it('maps listeners, bitrate, station name and online flag', () => {
    expect(result.currentListeners).toBe(2);
    expect(result.uniqueListeners).toBe(1);
    expect(result.bitrate).toBe('192');
    expect(result.serverTitle).toBe('trendradyo');
    expect(result.streamStatus).toBe(true);
    expect(result.provider).toBe('azuracast');
    expect(result.listenUrl).toBe('https://stream.netradyom.com/listen/trendradyo/radio.mp3');
  });

  it('uses AzuraCast ordering (ARTIST - TITLE), not TITLE - ARTIST', () => {
    const normalized = normalizeAzuracastNowPlaying({
      ...LIVE_PAYLOAD,
      now_playing: { song: { artist: 'OĞUZ YILMAZ', title: 'SEHER YILDIZI', text: 'ignored' } },
    });
    expect(normalized.currentSong).toBe('OĞUZ YILMAZ - SEHER YILDIZI');
  });

  it('treats a "Station Offline" title as nothing playing', () => {
    const normalized = normalizeAzuracastNowPlaying({
      ...LIVE_PAYLOAD,
      now_playing: { song: { text: 'Station Offline', title: 'Station Offline', artist: '' } },
    });
    expect(normalized.currentSong).toBe('');
  });

  it('survives a payload with empty song fields', () => {
    const normalized = normalizeAzuracastNowPlaying({
      station: { name: 'trendradyo', shortcode: 'trendradyo' },
      listeners: {},
      now_playing: { song: {} },
      is_online: false,
    });
    expect(normalized.currentSong).toBe('');
    expect(normalized.currentListeners).toBe(0);
    expect(normalized.streamStatus).toBe(false);
    expect(normalized.bitrate).toBe('128');
  });
});

describe('isAzuracastNowPlayingPayload', () => {
  it('accepts a real payload', () => {
    expect(isAzuracastNowPlayingPayload(LIVE_PAYLOAD)).toBe(true);
  });

  it.each([
    ['an HTML app shell string', '<!doctype html><html></html>'],
    ['a Shoutcast stats blob', { currentlisteners: 3, songtitle: 'X', streamstatus: 1 }],
    ['an array', []],
    ['null', null],
    ['a payload with no station', { listeners: {}, now_playing: {} }],
    ['a payload with no now_playing', { station: { shortcode: 'x' }, listeners: {} }],
    ['a payload with no listeners', { station: { shortcode: 'x' }, now_playing: {} }],
    ['an unidentified station', { station: {}, listeners: {}, now_playing: {} }],
  ])('rejects %s', (_label, value) => {
    expect(isAzuracastNowPlayingPayload(value)).toBe(false);
  });
});

describe('splitArtistTitle', () => {
  it('splits on the first separator only, preserving dashes in the title', () => {
    expect(splitArtistTitle('SİNCAN OTURAK ALEMİ - SAÇLARINI ÖREMEDİM - EKREM ÖZEL')).toEqual({
      artist: 'SİNCAN OTURAK ALEMİ',
      title: 'SAÇLARINI ÖREMEDİM - EKREM ÖZEL',
    });
  });

  it('treats a line with no separator as a bare title', () => {
    expect(splitArtistTitle('SEHER YILDIZI')).toEqual({ artist: null, title: 'SEHER YILDIZI' });
  });

  it('does not split on a hyphen inside a word', () => {
    expect(splitArtistTitle('AC/DC - Hells-Bells')).toEqual({
      artist: 'AC/DC',
      title: 'Hells-Bells',
    });
  });

  it('handles empty input', () => {
    expect(splitArtistTitle('')).toEqual({ artist: null, title: null });
    expect(splitArtistTitle(null)).toEqual({ artist: null, title: null });
  });
});

describe('classifyAzuracastEndpoint', () => {
  it('labels the static and dynamic endpoints', () => {
    expect(
      classifyAzuracastEndpoint('https://stream.netradyom.com/api/nowplaying_static/trendradyo.json')
    ).toBe('nowplaying_static');
    expect(classifyAzuracastEndpoint('https://stream.netradyom.com/api/nowplaying/trendradyo')).toBe(
      'nowplaying'
    );
  });
});

describe('songHistoryEntries (structured history for the mobile app)', () => {
  it('derives artist/title from the composed text when the server only sends `text`', () => {
    const entries = normalizeAzuracastNowPlaying(LIVE_PAYLOAD).songHistoryEntries;

    expect(entries).toHaveLength(3);
    expect(entries?.[0]).toEqual({
      artist: 'KAZANLI MESUT',
      title: 'BABA SON DURAĞIM U.H.',
      album: null,
      art: null,
      playedAt: null,
      duration: 0,
    });
  });

  it('maps played_at to an ISO timestamp and keeps album art', () => {
    const normalized = normalizeAzuracastNowPlaying({
      ...LIVE_PAYLOAD,
      song_history: [
        {
          played_at: 1756400000,
          duration: 212,
          song: {
            artist: 'SERTAB ERENER',
            title: 'FARZET',
            album: 'Sozlerimi Geri Aliyorum',
            art: 'https://stream.netradyom.com/static/generic_song.jpg',
          },
        },
      ],
    });

    expect(normalized.songHistoryEntries).toEqual([
      {
        artist: 'SERTAB ERENER',
        title: 'FARZET',
        album: 'Sozlerimi Geri Aliyorum',
        art: 'https://stream.netradyom.com/static/generic_song.jpg',
        playedAt: new Date(1756400000 * 1000).toISOString(),
        duration: 212,
      },
    ]);
  });

  it('stays in lockstep with the flat songHistory list', () => {
    const normalized = normalizeAzuracastNowPlaying(LIVE_PAYLOAD);
    expect(normalized.songHistoryEntries).toHaveLength(normalized.songHistory.length);
  });

  it('is an empty array when the payload carries no history', () => {
    const normalized = normalizeAzuracastNowPlaying({
      station: { shortcode: 'trendradyo' },
      listeners: {},
      now_playing: { song: {} },
    });
    expect(normalized.songHistoryEntries).toEqual([]);
  });
});
