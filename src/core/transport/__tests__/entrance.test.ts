// i18n-allow-cjk-file -- UTF-8 test fixture for the entrance header.
import { encodeEntranceHeader, normalizeEntrance } from '../entrance';

describe('entrance', () => {
  it('trims whitespace and surrounding slashes', () => {
    expect(normalizeEntrance('  /secret-entry/ ')).toBe('secret-entry');
    expect(normalizeEntrance('///a/b///')).toBe('a/b');
  });

  it('returns undefined for empty values', () => {
    expect(normalizeEntrance('')).toBeUndefined();
    expect(normalizeEntrance('   ')).toBeUndefined();
    expect(normalizeEntrance(undefined)).toBeUndefined();
  });

  it('encodes the normalised entrance as base64 UTF-8', () => {
    const decode = (value: string) => Buffer.from(value, 'base64').toString('utf8');

    expect(decode(encodeEntranceHeader('/admin/'))).toBe('admin');
    expect(decode(encodeEntranceHeader('入口'))).toBe('入口');
  });
});
