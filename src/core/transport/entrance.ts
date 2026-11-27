/**
 * Entrance (安全入口) is a request header, never a URL prefix:
 *   EntranceCode: base64(entrance)
 * See contracts/api/auth.md §4.
 */

/** Trim whitespace and leading/trailing slashes; empty becomes undefined. */
export function normalizeEntrance(entrance: string | undefined | null): string | undefined {
  if (entrance == null) {
    return undefined;
  }
  const normalized = entrance.trim().replace(/^\/+|\/+$/g, '');
  return normalized.length > 0 ? normalized : undefined;
}

export function encodeEntranceHeader(entrance: string): string {
  return toBase64Utf8(normalizeEntrance(entrance) ?? '');
}

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function toBase64Utf8(value: string): string {
  const bytes = utf8Bytes(value);
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;
    const chunk = (first << 16) | (second << 8) | third;

    output += BASE64_ALPHABET.charAt((chunk >> 18) & 0x3f);
    output += BASE64_ALPHABET.charAt((chunk >> 12) & 0x3f);
    output += index + 1 < bytes.length ? BASE64_ALPHABET.charAt((chunk >> 6) & 0x3f) : '=';
    output += index + 2 < bytes.length ? BASE64_ALPHABET.charAt(chunk & 0x3f) : '=';
  }

  return output;
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
