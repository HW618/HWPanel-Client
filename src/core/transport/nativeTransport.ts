import HwpTransport from '../../../modules/hwp-transport';

import { normalizeHost, normalizePort } from './trustKey';

/**
 * Thin typed facade over the local Expo module. Kept private to
 * `src/core/transport` — pages must go through `features/<domain>/api`.
 */
export const nativeTransport = {
  ping(): Promise<string> {
    return HwpTransport.ping();
  },

  async setAllowSelfSigned(host: string, port: number, enabled: boolean): Promise<void> {
    await HwpTransport.setAllowSelfSigned(normalizeHost(host), normalizePort(port), enabled);
  },

  getAllowedHosts(): Promise<string[]> {
    return HwpTransport.getAllowedHosts();
  },
};
