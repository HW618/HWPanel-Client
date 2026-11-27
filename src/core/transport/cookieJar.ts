import { CSRF_COOKIE_NAME } from './api';

/**
 * Per-server Cookie jar. RN's fetch does not persist cookies, so the session
 * mode has to carry them explicitly (`contracts/api/auth.md` §3.2).
 *
 * T01 keeps the jar in memory. TODO(T05): persist it through the credential
 * vault (SecureStore) and honour Path/Domain/Secure attributes.
 */
export class CookieJar {
  private readonly cookies = new Map<string, string>();

  /**
   * `setCookieHeaders` must contain one entry per Set-Cookie header. Do not
   * split a joined header on commas — `Expires` contains a comma.
   */
  applySetCookieHeaders(setCookieHeaders: readonly string[]): void {
    for (const header of setCookieHeaders) {
      this.applySetCookieHeader(header);
    }
  }

  applySetCookieHeader(header: string): void {
    const parsed = parseSetCookie(header);
    if (parsed == null) {
      return;
    }

    const expiredByMaxAge = parsed.maxAge !== undefined && parsed.maxAge <= 0;
    const expiredByDate = parsed.expiresAt !== undefined && parsed.expiresAt <= Date.now();
    if (expiredByMaxAge || expiredByDate) {
      this.cookies.delete(parsed.name);
      return;
    }

    this.cookies.set(parsed.name, parsed.value);
  }

  get(name: string): string | undefined {
    return this.cookies.get(name);
  }

  get csrfToken(): string | undefined {
    return this.cookies.get(CSRF_COOKIE_NAME);
  }

  isEmpty(): boolean {
    return this.cookies.size === 0;
  }

  /** Value for the `Cookie` request header, or undefined when empty. */
  toCookieHeader(): string | undefined {
    if (this.cookies.size === 0) {
      return undefined;
    }
    return Array.from(this.cookies, ([name, value]) => `${name}=${value}`).join('; ');
  }

  /** Debug-safe copy: names only. Never log values (they are credentials). */
  listCookieNames(): string[] {
    return Array.from(this.cookies.keys());
  }

  clear(): void {
    this.cookies.clear();
  }
}

export interface ParsedSetCookie {
  name: string;
  value: string;
  maxAge?: number;
  expiresAt?: number;
}

export function parseSetCookie(header: string): ParsedSetCookie | null {
  const segments = header.split(';');
  const pair = segments[0]?.trim();
  if (!pair) {
    return null;
  }

  const separatorIndex = pair.indexOf('=');
  if (separatorIndex <= 0) {
    return null;
  }

  const name = pair.slice(0, separatorIndex).trim();
  const value = pair.slice(separatorIndex + 1).trim();
  if (name.length === 0) {
    return null;
  }

  let maxAge: number | undefined;
  let expiresAt: number | undefined;

  for (const rawAttribute of segments.slice(1)) {
    const attribute = rawAttribute.trim();
    const attributeSeparator = attribute.indexOf('=');
    const key = (attributeSeparator === -1 ? attribute : attribute.slice(0, attributeSeparator))
      .trim()
      .toLowerCase();
    const attributeValue =
      attributeSeparator === -1 ? '' : attribute.slice(attributeSeparator + 1).trim();

    if (key === 'max-age') {
      const parsed = Number.parseInt(attributeValue, 10);
      if (Number.isFinite(parsed)) {
        maxAge = parsed;
      }
    } else if (key === 'expires') {
      const parsed = Date.parse(attributeValue);
      if (Number.isFinite(parsed)) {
        expiresAt = parsed;
      }
    }
  }

  return { name, value, maxAge, expiresAt };
}
