/**
 * Turkish mojibake repair (isomorphic, dependency-free).
 *
 * Some upstream metadata sources (the AzuraCast relay in front of the legacy
 * Shoutcast box, and the Shoutcast box itself) emit Windows-1254 bytes that a
 * downstream layer has already decoded as Latin-1. The result is classic
 * Turkish mojibake:
 *
 *   'BABA SON DURAÐIM'  ->  'BABA SON DURAĞIM'
 *   'SÝNCANLI HÜSEYÝN'  ->  'SİNCANLI HÜSEYİN'
 *
 * The repair is: take the string's char codes back to bytes and re-decode them
 * as windows-1254.
 *
 * IMPORTANT: this is only applied when the string carries a tell-tale
 * character. Windows-1254 and Latin-1 only disagree on six letters plus the
 * 0x80-0x9F block, so a correctly-encoded string would survive the round trip
 * unchanged anyway — but guarding keeps genuinely foreign text (Icelandic
 * 'Þ'/'ð', for example) from being silently rewritten.
 */

/**
 * Characters that appear when Windows-1254 Turkish letters are mis-decoded as
 * Latin-1. None of these occur in real Turkish text, so their presence is a
 * reliable mojibake signal.
 *
 *   Ð (0xD0) -> Ğ   Ý (0xDD) -> İ   Þ (0xDE) -> Ş
 *   ð (0xF0) -> ğ   ý (0xFD) -> ı   þ (0xFE) -> ş
 */
const MOJIBAKE_MARKERS = /[ÐÝÞðýþ]/;

/**
 * Byte -> character overrides where windows-1254 differs from Latin-1.
 * Used by the pure-JS decoder fallback; every other byte is identity-mapped,
 * which is exactly how the two encodings relate.
 */
const WINDOWS_1254_OVERRIDES: Readonly<Record<number, string>> = {
  0x80: '€', 0x82: '‚', 0x83: 'ƒ', 0x84: '„',
  0x85: '…', 0x86: '†', 0x87: '‡', 0x88: 'ˆ',
  0x89: '‰', 0x8a: 'Š', 0x8b: '‹', 0x8c: 'Œ',
  0x91: '‘', 0x92: '’', 0x93: '“', 0x94: '”',
  0x95: '•', 0x96: '–', 0x97: '—', 0x98: '˜',
  0x99: '™', 0x9a: 'š', 0x9b: '›', 0x9c: 'œ',
  0x9f: 'Ÿ',
  0xd0: 'Ğ', // Ğ
  0xdd: 'İ', // İ
  0xde: 'Ş', // Ş
  0xf0: 'ğ', // ğ
  0xfd: 'ı', // ı
  0xfe: 'ş', // ş
};

/** Cached TextDecoder; `null` once we know this runtime cannot build one. */
let cachedDecoder: TextDecoder | null | undefined;

function getDecoder(): TextDecoder | null {
  if (cachedDecoder !== undefined) return cachedDecoder;

  try {
    if (typeof TextDecoder === 'undefined') {
      cachedDecoder = null;
    } else {
      const decoder = new TextDecoder('windows-1254');
      // A runtime built with small-icu silently falls back to utf-8 rather than
      // throwing, so confirm the label actually took.
      cachedDecoder = decoder.encoding === 'windows-1254' ? decoder : null;
    }
  } catch {
    cachedDecoder = null;
  }

  return cachedDecoder;
}

/** Pure-JS windows-1254 decode. Used when TextDecoder is unavailable. */
function decodeWithTable(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    out += WINDOWS_1254_OVERRIDES[byte] ?? String.fromCharCode(byte);
  }
  return out;
}

/**
 * Re-decode a Latin-1-mangled string as windows-1254.
 * Exported for tests; prefer {@link fixTurkishMojibake} in application code.
 */
export function decodeAsWindows1254(input: string): string {
  const bytes = Uint8Array.from(input, (char) => char.charCodeAt(0) & 0xff);
  const decoder = getDecoder();
  return decoder ? decoder.decode(bytes) : decodeWithTable(bytes);
}

/**
 * Repair Turkish mojibake, leaving already-correct strings untouched.
 *
 * Returns the input unchanged for empty/non-string values and for any string
 * without a mojibake marker, so it is safe to apply blanket-style to every
 * human-readable field from any provider.
 */
export function fixTurkishMojibake<T extends string | null | undefined>(input: T): T {
  if (typeof input !== 'string' || input.length === 0) return input;
  if (!MOJIBAKE_MARKERS.test(input)) return input;

  try {
    return decodeAsWindows1254(input) as T;
  } catch {
    // Never let an encoding repair break a metadata response.
    return input;
  }
}

/** True when a string looks like Windows-1254-as-Latin-1 mojibake. */
export function hasTurkishMojibake(input: string | null | undefined): boolean {
  return typeof input === 'string' && MOJIBAKE_MARKERS.test(input);
}
