import { createHash } from 'node:crypto';

import {
  API_KEY_HEADER,
  API_KEY_SIGNATURE_VERSION_HEADER,
  API_KEY_TIMESTAMP_HEADER,
} from '../apiKey';
import { CookieJar } from '../cookieJar';
import { buildRequestHeaders, buildRequestUrl } from '../requestHeaders';

function jarWithSession(): CookieJar {
  const jar = new CookieJar();
  jar.applySetCookieHeaders(['session=abc; Path=/', 'pcsrftoken=csrf-1; Path=/']);
  return jar;
}

describe('buildRequestHeaders', () => {
  it('always sends Accept-Language: zh-CN', () => {
    const headers = buildRequestHeaders({
      method: 'GET',
      path: '/dashboard/base/os',
      authMode: 'password',
    });

    expect(headers['Accept-Language']).toBe('zh-CN');
  });

  it('attaches the cookie jar and CSRF token for session mode', () => {
    const headers = buildRequestHeaders({
      method: 'POST',
      path: '/containers/restart',
      authMode: 'password',
      cookieJar: jarWithSession(),
    });

    expect(headers.Cookie).toBe('session=abc; pcsrftoken=csrf-1');
    expect(headers['X-CSRF-Token']).toBe('csrf-1');
  });

  it('does not add CSRF to safe methods', () => {
    const headers = buildRequestHeaders({
      method: 'GET',
      path: '/containers/list',
      authMode: 'password',
      cookieJar: jarWithSession(),
    });

    expect(headers['X-CSRF-Token']).toBeUndefined();
  });

  it('never uses cookies or entrance in api-key mode and signs the request', () => {
    const apiKey = 'test-api-key';
    const timestampSeconds = 1_700_000_000;
    const headers = buildRequestHeaders({
      method: 'POST',
      path: '/core/auth/login',
      authMode: 'api-key',
      entrance: '/secret/',
      cookieJar: jarWithSession(),
      apiKey: { apiKey, timestampSeconds },
    });

    expect(headers.Cookie).toBeUndefined();
    expect(headers['X-CSRF-Token']).toBeUndefined();
    expect(headers.EntranceCode).toBeUndefined();
    expect(headers[API_KEY_HEADER]).toBe(
      createHash('md5').update(`1panel${apiKey}${timestampSeconds}`).digest('hex'),
    );
    expect(headers[API_KEY_TIMESTAMP_HEADER]).toBe('1700000000');
    expect(headers[API_KEY_SIGNATURE_VERSION_HEADER]).toBe('v1');
  });

  it('adds EntranceCode only to login-class requests', () => {
    const loginHeaders = buildRequestHeaders({
      method: 'POST',
      path: '/core/auth/login',
      authMode: 'password',
      entrance: '/secret/',
    });
    expect(loginHeaders.EntranceCode).toBeDefined();

    const normalHeaders = buildRequestHeaders({
      method: 'GET',
      path: '/core/auth/current',
      authMode: 'password',
      entrance: '/secret/',
    });
    expect(normalHeaders.EntranceCode).toBeUndefined();
  });

  it('supports paths that already include /api/v2', () => {
    const headers = buildRequestHeaders({
      method: 'POST',
      path: '/api/v2/core/auth/mfalogin',
      authMode: 'password',
      entrance: 'secret',
    });

    expect(headers.EntranceCode).toBeDefined();
  });

  it('ignores an empty entrance', () => {
    const headers = buildRequestHeaders({
      method: 'POST',
      path: '/core/auth/login',
      authMode: 'password',
      entrance: '  //  ',
    });

    expect(headers.EntranceCode).toBeUndefined();
  });
});

describe('buildRequestUrl', () => {
  it('joins origin, /api/v2 and the path without double slashes', () => {
    expect(buildRequestUrl('https://panel.example.com:8443/', '/core/auth/current')).toBe(
      'https://panel.example.com:8443/api/v2/core/auth/current',
    );
  });
});
