import { normalizeHost, normalizePort, trustKey } from '../trustKey';

describe('trustKey', () => {
  it('normalises host casing, whitespace and IPv6 brackets', () => {
    expect(normalizeHost('  Panel.Example.COM ')).toBe('panel.example.com');
    expect(normalizeHost('[::1]')).toBe('::1');
  });

  it('rejects empty hosts and hosts carrying a port or path', () => {
    expect(() => normalizeHost('   ')).toThrow();
    expect(() => normalizeHost('example.com:8443')).toThrow();
    expect(() => normalizeHost('https://example.com')).toThrow();
  });

  it('validates ports', () => {
    expect(normalizePort(8443)).toBe(8443);
    expect(() => normalizePort(0)).toThrow();
    expect(() => normalizePort(65536)).toThrow();
    expect(() => normalizePort(1.5)).toThrow();
  });

  it('builds a stable host:port key', () => {
    expect(trustKey('Panel.Example.com', 8443)).toBe('panel.example.com:8443');
    expect(trustKey('[::1]', 443)).toBe('::1:443');
  });
});
