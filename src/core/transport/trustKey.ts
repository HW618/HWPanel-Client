/**
 * Trust is scoped to a single `host:port` pair. JS and native must normalise
 * the key identically, otherwise a relaxed certificate check could silently
 * apply to the wrong endpoint.
 */

export function normalizeHost(host: string): string {
  const trimmed = host.trim().toLowerCase();
  // URLSession reports IPv6 hosts without brackets; strip them if a caller
  // passes a bracketed literal.
  const unbracketed =
    trimmed.startsWith('[') && trimmed.endsWith(']') ? trimmed.slice(1, -1) : trimmed;

  if (unbracketed.length === 0) {
    throw new Error('host must not be empty');
  }
  if (unbracketed.includes('/') || unbracketed.includes(':')) {
    // A bare host only: scheme/port/path must be supplied separately.
    if (!isIPv6Literal(unbracketed)) {
      throw new Error(`invalid host: ${host}`);
    }
  }
  return unbracketed;
}

export function normalizePort(port: number): number {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`invalid port: ${port}`);
  }
  return port;
}

export function trustKey(host: string, port: number): string {
  return `${normalizeHost(host)}:${normalizePort(port)}`;
}

function isIPv6Literal(value: string): boolean {
  return value.split(':').length > 2;
}
