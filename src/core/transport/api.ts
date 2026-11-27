/**
 * Wire-level constants from `contracts/api/auth.md` (U1 resolved).
 * Everything here is transport-layer knowledge; features must not depend on it.
 */

export const API_BASE_PATH = '/api/v2';

export const ACCEPT_LANGUAGE = 'zh-CN';

export const SAFE_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

/**
 * `EntranceCode` is only attached to login-class requests, never globally.
 * Paths are relative to `API_BASE_PATH`.
 */
export const LOGIN_ENTRANCE_PATHS: ReadonlySet<string> = new Set([
  '/core/auth/login',
  '/core/auth/mfalogin',
  '/core/auth/passkey/begin',
  '/core/auth/passkey/finish',
  '/core/auth/oidc/begin',
  '/core/auth/oidc/finish',
  '/core/auth/saml2/begin',
  '/core/auth/saml2/finish',
]);

export const CSRF_COOKIE_NAME = 'pcsrftoken';
export const CSRF_HEADER_NAME = 'X-CSRF-Token';
export const ENTRANCE_HEADER_NAME = 'EntranceCode';

/** Container and compose logs share this SSE endpoint (U2 resolved). */
export const LOG_STREAM_PATH = '/containers/search/log';
export const LOG_STREAM_ACCEPT = 'text/event-stream';

/** Panel version is `systemVersion` here, not on /dashboard/base/os (U4). */
export const PANEL_VERSION_PATH = '/settings/search';
export const PANEL_VERSION_FIELD = 'systemVersion';

export function toApiPath(path: string): string {
  const withoutQuery = path.split(/[?#]/, 1)[0] ?? '';
  const relative = withoutQuery.startsWith(API_BASE_PATH)
    ? withoutQuery.slice(API_BASE_PATH.length)
    : withoutQuery;
  return relative.startsWith('/') ? relative : `/${relative}`;
}

export function isLoginEntrancePath(path: string): boolean {
  return LOGIN_ENTRANCE_PATHS.has(toApiPath(path));
}
