import {
  ACCEPT_LANGUAGE,
  CSRF_HEADER_NAME,
  ENTRANCE_HEADER_NAME,
  API_BASE_PATH,
  SAFE_METHODS,
  isLoginEntrancePath,
} from './api';
import { buildApiKeyHeaders, type ApiKeySigningMaterial } from './apiKey';
import type { CookieJar } from './cookieJar';
import { encodeEntranceHeader, normalizeEntrance } from './entrance';
import type { AuthMode } from './types';

export interface BuildRequestHeadersInput {
  method: string;
  /** Path relative to the API base, e.g. `/core/auth/login`. */
  path: string;
  authMode: AuthMode;
  entrance?: string;
  cookieJar?: CookieJar;
  /** Required for API-Key mode; never persisted or logged here. */
  apiKey?: ApiKeySigningMaterial;
  extraHeaders?: Record<string, string>;
}

/**
 * Header injection is centralised here so T05 cannot accidentally spread
 * Entrance/CSRF logic into features.
 */
export function buildRequestHeaders(input: BuildRequestHeadersInput): Record<string, string> {
  const method = input.method.toUpperCase();
  const headers: Record<string, string> = {
    ...input.extraHeaders,
    // MVP ships zh-CN only (docs/prd.md §2.2), so the language header is fixed.
    'Accept-Language': ACCEPT_LANGUAGE,
  };

  if (input.authMode === 'password' && input.cookieJar != null) {
    const cookieHeader = input.cookieJar.toCookieHeader();
    if (cookieHeader != null) {
      headers.Cookie = cookieHeader;
    }

    if (!SAFE_METHODS.has(method)) {
      const csrfToken = input.cookieJar.csrfToken;
      if (csrfToken != null) {
        headers[CSRF_HEADER_NAME] = csrfToken;
      }
    }
  }

  if (input.authMode === 'api-key' && input.apiKey != null) {
    Object.assign(headers, buildApiKeyHeaders(input.apiKey));
  }

  // API-Key mode does not need EntranceCode (verified on v2.5.1).
  const entrance = normalizeEntrance(input.entrance);
  if (input.authMode === 'password' && entrance != null && isLoginEntrancePath(input.path)) {
    headers[ENTRANCE_HEADER_NAME] = encodeEntranceHeader(entrance);
  }

  return headers;
}

/** Joins the endpoint origin, `/api/v2` and the endpoint-relative path. */
export function buildRequestUrl(origin: string, path: string): string {
  const normalizedOrigin = origin.replace(/\/+$/g, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedOrigin}${API_BASE_PATH}${normalizedPath}`;
}
