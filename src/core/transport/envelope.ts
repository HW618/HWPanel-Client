import type { PanelEnvelope } from '@/contracts/envelope';
import type { PanelError } from '@/contracts/errors';

// TODO(T05): fill `PanelError.message` from the localised error catalogue;
// T01 only establishes the parse/classify seam.

/**
 * Transport outcome separates the two failure domains:
 * - a body was received (any HTTP status): `envelope` is present and `ok` is
 *   decided by `body.code`, never by the HTTP status;
 * - the network layer failed (connect/TLS/timeout): there is no envelope.
 */
export type TransportOutcome<T> =
  | {
      ok: true;
      status: number;
      envelope: PanelEnvelope<T>;
      data: T;
    }
  | {
      ok: false;
      status: number | null;
      envelope: PanelEnvelope<unknown> | null;
      error: PanelError;
    };

/** Parses the raw response text and then applies envelope semantics. */
export function parsePanelBody<T>(text: string, status: number): TransportOutcome<T> {
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return {
      ok: false,
      status,
      envelope: null,
      error: {
        kind: 'unknown',
        status,
        message: '',
        retryable: false,
      },
    };
  }
  return parsePanelEnvelope<T>(body, status);
}

/**
 * Parses an already-decoded JSON body. The HTTP status is carried only for
 * diagnostics — the panel answers 200 even for 401, and may answer non-200 for
 * a valid success envelope through proxies, so the body is authoritative.
 */
export function parsePanelEnvelope<T>(body: unknown, status: number): TransportOutcome<T> {
  if (!isPanelEnvelope(body)) {
    return {
      ok: false,
      status,
      envelope: null,
      error: {
        kind: 'unknown',
        status,
        // TODO(T05): localise through src/core/errors.
        message: '',
        retryable: true,
      },
    };
  }

  if (body.code === 200) {
    return {
      ok: true,
      status,
      envelope: body as PanelEnvelope<T>,
      data: body.data as T,
    };
  }

  return {
    ok: false,
    status,
    envelope: body,
    error: {
      kind: isAuthCode(body.code) ? 'auth' : 'business',
      status,
      message: '',
      retryable: body.code >= 500 || isAuthCode(body.code),
    },
  };
}

/**
 * Network-layer failure: no HTTP body exists. TODO(T05): split timeout /
 * TLS from the RN error payload; until then everything is `network`.
 */
export function networkFailure(error: unknown): TransportOutcome<never> {
  return {
    ok: false,
    status: null,
    envelope: null,
    error: {
      kind: 'network',
      message: error instanceof Error ? error.message : '',
      retryable: true,
    },
  };
}

export function isPanelEnvelope(value: unknown): value is PanelEnvelope<unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.code === 'number' &&
    typeof candidate.message === 'string' &&
    'data' in candidate
  );
}

function isAuthCode(code: number): boolean {
  return code === 401 || code === 403;
}
