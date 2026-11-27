import { nativeTransport } from './nativeTransport';
import { normalizeHost, normalizePort } from './trustKey';
import type { PanelEndpoint, PanelTransport } from './types';

/**
 * One transport per server instance. The trust decision is scoped to the
 * instance's `host:port`; creating a transport never relaxes global TLS.
 */
export function createPanelTransport(endpoint: PanelEndpoint): PanelTransport {
  const normalized: PanelEndpoint = {
    ...endpoint,
    host: normalizeHost(endpoint.host),
    port: normalizePort(endpoint.port),
  };

  return {
    endpoint: normalized,

    ping() {
      return nativeTransport.ping();
    },

    async applyTrustPolicy() {
      await nativeTransport.setAllowSelfSigned(
        normalized.host,
        normalized.port,
        normalized.allowSelfSigned,
      );
    },
  };
}
