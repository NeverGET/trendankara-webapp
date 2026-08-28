import {
  decodeAsWindows1254,
  fixTurkishMojibake,
  hasTurkishMojibake,
} from '@/lib/utils/turkishEncoding';

/**
 * Every `mojibake -> expected` pair below was captured from the live AzuraCast
 * feed at https://stream.netradyom.com/api/nowplaying/<station>.
 */
const LIVE_SAMPLES: Array<[string, string]> = [
  ['KAZANLI MESUT - BABA SON DURAÐIM U.H.', 'KAZANLI MESUT - BABA SON DURAĞIM U.H.'],
  ['SÝNCANLI HÜSEYÝN DEMÝRBÝLEK', 'SİNCANLI HÜSEYİN DEMİRBİLEK'],
  [
    'SÝNCAN OTURAK ALEMÝ - SAÇLARINI ÖREMEDÝM - EKREM ÖZEL',
    'SİNCAN OTURAK ALEMİ - SAÇLARINI ÖREMEDİM - EKREM ÖZEL',
  ],
  ['OÐUZ YILMAZ - SEHER YILDIZI', 'OĞUZ YILMAZ - SEHER YILDIZI'],
  ['AYAÞLI SERHAT - SATI GELÝN', 'AYAŞLI SERHAT - SATI GELİN'],
  ['SÝNCANLI HÜSEYÝN DEMÝRBÝLEK - GAMLI FELEK', 'SİNCANLI HÜSEYİN DEMİRBİLEK - GAMLI FELEK'],
  ['MALALLI HAKAN - ZANNETMEKÝ', 'MALALLI HAKAN - ZANNETMEKİ'],
];

describe('fixTurkishMojibake', () => {
  it.each(LIVE_SAMPLES)('repairs %s', (mojibake, expected) => {
    expect(fixTurkishMojibake(mojibake)).toBe(expected);
  });

  it('maps every Windows-1254 Turkish letter that Latin-1 mangles', () => {
    expect(fixTurkishMojibake('Ð Ý Þ ð ý þ')).toBe('Ğ İ Ş ğ ı ş');
  });

  describe('guard: leaves correctly-encoded text untouched', () => {
    // A properly-encoded source (e.g. the live trendradyo feed) must pass
    // through byte-for-byte — this is why the repair is gated on a marker.
    const CLEAN = [
      'SİNCAN OTURAK ALEMİ - SAÇLARINI ÖREMEDİM',
      'Radyo Çalıyor',
      'En güncel müzikler ve haberler',
      'Şarkı: Güneş Doğarken',
      'AC/DC - Highway to Hell',
      'Beyoncé - Déjà Vu',
      'Мой рок',
      '日本語のタイトル',
      '',
    ];

    it.each(CLEAN)('leaves %s unchanged', (input) => {
      expect(fixTurkishMojibake(input)).toBe(input);
    });

    it('is idempotent — repairing twice changes nothing', () => {
      for (const [mojibake, expected] of LIVE_SAMPLES) {
        expect(fixTurkishMojibake(fixTurkishMojibake(mojibake))).toBe(expected);
      }
    });
  });

  it('passes through null and undefined', () => {
    expect(fixTurkishMojibake(null)).toBeNull();
    expect(fixTurkishMojibake(undefined)).toBeUndefined();
  });
});

describe('hasTurkishMojibake', () => {
  it('detects the tell-tale characters', () => {
    expect(hasTurkishMojibake('BABA SON DURAÐIM')).toBe(true);
    expect(hasTurkishMojibake('BABA SON DURAĞIM')).toBe(false);
    expect(hasTurkishMojibake(null)).toBe(false);
  });
});

describe('decoder fallback', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('produces identical output when TextDecoder is unavailable', async () => {
    const original = global.TextDecoder;

    try {
      // Force the pure-JS windows-1254 table path (small-icu Node builds, or
      // any runtime without the windows-1254 label).
      // @ts-expect-error deliberately removing the global for this test
      delete global.TextDecoder;
      jest.resetModules();

      const { decodeAsWindows1254: tableDecode } = await import('@/lib/utils/turkishEncoding');

      for (const [mojibake, expected] of LIVE_SAMPLES) {
        expect(tableDecode(mojibake)).toBe(expected);
      }
    } finally {
      global.TextDecoder = original;
    }
  });

  it('agrees with the TextDecoder path on the live samples', () => {
    for (const [mojibake, expected] of LIVE_SAMPLES) {
      expect(decodeAsWindows1254(mojibake)).toBe(expected);
    }
  });
});
