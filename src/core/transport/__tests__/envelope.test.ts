import { isPanelEnvelope, networkFailure, parsePanelBody, parsePanelEnvelope } from '../envelope';

describe('parsePanelEnvelope', () => {
  it('treats body.code as authoritative, not the HTTP status', () => {
    const result = parsePanelEnvelope<{ ok: true }>(
      { code: 200, message: 'success', data: { ok: true } },
      500,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ ok: true });
      expect(result.status).toBe(500);
    }
  });

  it('parses an unauthenticated 200 response as an auth error', () => {
    const body = { code: 401, message: 'session expired', data: null };
    const result = parsePanelEnvelope(body, 200);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(200);
      expect(result.envelope).toEqual(body);
      expect(result.error.kind).toBe('auth');
      expect(result.error.retryable).toBe(true);
    }
  });

  it('maps other business codes to business errors with the envelope retained', () => {
    const body = { code: 400, message: 'bad request', data: null };
    const result = parsePanelEnvelope(body, 200);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('business');
      expect(result.envelope).toEqual(body);
    }
  });

  it('rejects malformed bodies as unknown', () => {
    const result = parsePanelEnvelope({ hello: 'world' }, 200);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('unknown');
      expect(result.envelope).toBeNull();
    }
  });

  it('recognises the envelope shape', () => {
    expect(isPanelEnvelope({ code: 200, message: 'ok', data: null })).toBe(true);
    expect(isPanelEnvelope({ code: '200', message: 'ok', data: null })).toBe(false);
    expect(isPanelEnvelope(null)).toBe(false);
  });
});

describe('parsePanelBody', () => {
  it('parses raw JSON text through the envelope rules', () => {
    const result = parsePanelBody<{ name: string }>(
      '{"code":200,"message":"success","data":{"name":"panel"}}',
      200,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ name: 'panel' });
    }
  });

  it('treats invalid JSON as unknown without retrying', () => {
    const result = parsePanelBody('<html>gateway</html>', 502);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('unknown');
      expect(result.error.retryable).toBe(false);
      expect(result.status).toBe(502);
    }
  });
});

describe('networkFailure', () => {
  it('has no envelope and is retryable', () => {
    const result = networkFailure(new Error('connect ECONNREFUSED'));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBeNull();
      expect(result.envelope).toBeNull();
      expect(result.error.kind).toBe('network');
      expect(result.error.retryable).toBe(true);
    }
  });
});
