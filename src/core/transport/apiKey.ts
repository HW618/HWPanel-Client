/**
 * API-Key auth headers, verified against 1Panel v2.5.1:
 *   token = md5("1panel" + apiKey + timestamp)
 *   header names: see contracts/api/auth.md §3.1
 *
 * Pure functions only — the credential itself is read from the vault by T05
 * and must never be logged.
 */

export const API_KEY_HEADER = '1Panel-Token';
export const API_KEY_TIMESTAMP_HEADER = '1Panel-Timestamp';
export const API_KEY_SIGNATURE_VERSION_HEADER = '1Panel-Signature-Version';
export const API_KEY_SIGNATURE_VERSION = 'v1';

export interface ApiKeySigningMaterial {
  apiKey: string;
  /** Unix seconds. */
  timestampSeconds: number;
}

export interface ApiKeyHeaders {
  [API_KEY_HEADER]: string;
  [API_KEY_TIMESTAMP_HEADER]: string;
  [API_KEY_SIGNATURE_VERSION_HEADER]: string;
}

export function buildApiKeyHeaders(material: ApiKeySigningMaterial): ApiKeyHeaders {
  const timestamp = Math.floor(material.timestampSeconds);
  const signature = md5Hex(`1panel${material.apiKey}${timestamp}`);

  return {
    [API_KEY_HEADER]: signature,
    [API_KEY_TIMESTAMP_HEADER]: String(timestamp),
    [API_KEY_SIGNATURE_VERSION_HEADER]: API_KEY_SIGNATURE_VERSION,
  };
}

export function currentTimestampSeconds(nowMs: number = Date.now()): number {
  return Math.floor(nowMs / 1000);
}

const SHIFT_AMOUNTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14,
  20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6,
  10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

const SINE_TABLE = Array.from({ length: 64 }, (_, index) =>
  Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000),
);

/** RFC 1321 MD5 over UTF-8 bytes. Kept local: Hermes has no stable crypto. */
export function md5Hex(input: string): string {
  const message = utf8Bytes(input);
  const byteLength = message.length;
  const paddedLength = (((byteLength + 8) >> 6) + 1) << 6;
  const buffer = new Uint8Array(paddedLength);
  buffer.set(message);
  buffer[byteLength] = 0x80;

  const view = new DataView(buffer.buffer);
  const bitLength = byteLength * 8;
  view.setUint32(paddedLength - 8, bitLength >>> 0, true);
  view.setUint32(paddedLength - 4, Math.floor(bitLength / 0x100000000), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let offset = 0; offset < paddedLength; offset += 64) {
    const words = new Array<number>(16);
    for (let index = 0; index < 16; index += 1) {
      words[index] = view.getUint32(offset + index * 4, true);
    }

    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let index = 0; index < 64; index += 1) {
      let mixed: number;
      let wordIndex: number;

      if (index < 16) {
        mixed = (b & c) | (~b & d);
        wordIndex = index;
      } else if (index < 32) {
        mixed = (d & b) | (~d & c);
        wordIndex = (5 * index + 1) % 16;
      } else if (index < 48) {
        mixed = b ^ c ^ d;
        wordIndex = (3 * index + 5) % 16;
      } else {
        mixed = c ^ (b | ~d);
        wordIndex = (7 * index) % 16;
      }

      const sum = (a + mixed + (SINE_TABLE[index] ?? 0) + (words[wordIndex] ?? 0)) >>> 0;
      const rotated = rotateLeft(sum, SHIFT_AMOUNTS[index] ?? 0);

      a = d;
      d = c;
      c = b;
      b = (b + rotated) >>> 0;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  return [a0, b0, c0, d0].map(wordToLittleEndianHex).join('');
}

function rotateLeft(value: number, shift: number): number {
  return ((value << shift) | (value >>> (32 - shift))) >>> 0;
}

function wordToLittleEndianHex(word: number): string {
  let hex = '';
  for (let index = 0; index < 4; index += 1) {
    hex += ((word >>> (index * 8)) & 0xff).toString(16).padStart(2, '0');
  }
  return hex;
}

function utf8Bytes(value: string): number[] {
  const bytes: number[] = [];
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint <= 0x7f) {
      bytes.push(codePoint);
    } else if (codePoint <= 0x7ff) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint <= 0xffff) {
      bytes.push(
        0xe0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    }
  }
  return bytes;
}
