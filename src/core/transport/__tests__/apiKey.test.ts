import { createHash } from 'node:crypto';

import {
  API_KEY_HEADER,
  API_KEY_SIGNATURE_VERSION,
  API_KEY_SIGNATURE_VERSION_HEADER,
  API_KEY_TIMESTAMP_HEADER,
  buildApiKeyHeaders,
  currentTimestampSeconds,
  md5Hex,
} from '../apiKey';

const md5 = (value: string) => createHash('md5').update(value, 'utf8').digest('hex');

describe('md5Hex', () => {
  it('matches known MD5 vectors (RFC 1321)', () => {
    expect(md5Hex('')).toBe(md5(''));
    expect(md5Hex('abc')).toBe(md5('abc'));
    expect(md5Hex('The quick brown fox jumps over the lazy dog')).toBe(
      md5('The quick brown fox jumps over the lazy dog'),
    );
  });

  it('hashes UTF-8 bytes, not UTF-16 code units', () => {
    const chinese = String.fromCharCode(0x4e2d, 0x6587);
    expect(md5Hex(chinese)).toBe(md5(chinese));
  });
});

describe('buildApiKeyHeaders', () => {
  it('signs md5("1panel" + apiKey + timestamp)', () => {
    const apiKey = 'test-api-key';
    const timestampSeconds = 1_700_000_000;
    const headers = buildApiKeyHeaders({ apiKey, timestampSeconds });

    expect(headers[API_KEY_HEADER]).toBe(md5(`1panel${apiKey}${timestampSeconds}`));
    expect(headers[API_KEY_TIMESTAMP_HEADER]).toBe('1700000000');
    expect(headers[API_KEY_SIGNATURE_VERSION_HEADER]).toBe(API_KEY_SIGNATURE_VERSION);
    expect(API_KEY_SIGNATURE_VERSION).toBe('v1');
  });

  it('floors fractional timestamps to unix seconds', () => {
    const headers = buildApiKeyHeaders({
      apiKey: 'k',
      timestampSeconds: 1_700_000_000.9,
    });

    expect(headers[API_KEY_TIMESTAMP_HEADER]).toBe('1700000000');
  });

  it('derives unix seconds from a millisecond clock', () => {
    expect(currentTimestampSeconds(1_700_000_000_999)).toBe(1_700_000_000);
  });
});
