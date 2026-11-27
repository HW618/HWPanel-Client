import { CookieJar, parseSetCookie } from '../cookieJar';

describe('parseSetCookie', () => {
  it('parses name, value, max-age and expires', () => {
    const parsed = parseSetCookie(
      'session=abc123; Path=/; HttpOnly; Max-Age=3600; Expires=Wed, 21 Oct 2026 07:28:00 GMT',
    );

    expect(parsed).toEqual({
      name: 'session',
      value: 'abc123',
      maxAge: 3600,
      expiresAt: Date.parse('Wed, 21 Oct 2026 07:28:00 GMT'),
    });
  });

  it('keeps "=" inside the value and rejects malformed headers', () => {
    expect(parseSetCookie('token=a=b=c; Path=/')?.value).toBe('a=b=c');
    expect(parseSetCookie('no-equals-sign')).toBeNull();
    expect(parseSetCookie('=novalue')).toBeNull();
  });
});

describe('CookieJar', () => {
  it('builds a Cookie header and exposes the CSRF token', () => {
    const jar = new CookieJar();
    jar.applySetCookieHeaders(['session=abc; Path=/', 'pcsrftoken=csrf-1; Path=/']);

    expect(jar.toCookieHeader()).toBe('session=abc; pcsrftoken=csrf-1');
    expect(jar.csrfToken).toBe('csrf-1');
    expect(jar.listCookieNames()).toEqual(['session', 'pcsrftoken']);
  });

  it('drops cookies on Max-Age=0', () => {
    const jar = new CookieJar();
    jar.applySetCookieHeader('session=abc');
    jar.applySetCookieHeader('session=; Max-Age=0');

    expect(jar.toCookieHeader()).toBeUndefined();
    expect(jar.isEmpty()).toBe(true);
  });

  it('does not leak values through the debug name list', () => {
    const jar = new CookieJar();
    jar.applySetCookieHeader('session=super-secret');

    expect(jar.listCookieNames()).toEqual(['session']);
    expect(JSON.stringify(jar.listCookieNames())).not.toContain('super-secret');
  });
});
