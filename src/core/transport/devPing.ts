import { nativeTransport } from './nativeTransport';
import { trustKey } from './trustKey';

/** Reserved `.invalid` host: the probe never leaves the device. */
const TRUST_PROBE_HOST = 'dev-probe.invalid';
const TRUST_PROBE_PORT = 443;

/**
 * Development-only smoke check that the local native module is linked on both
 * platforms and that the per-instance trust allow-list round-trips. Never logs
 * credentials or request headers (there are none here).
 */
export async function logNativePingOnce(): Promise<void> {
  if (!__DEV__) {
    return;
  }
  try {
    const identity = await nativeTransport.ping();
    console.info(`[hwp-transport] ping -> ${identity}`);
  } catch (error) {
    console.warn(`[hwp-transport] ping failed: ${describe(error)}`);
    return;
  }

  const probeKey = trustKey(TRUST_PROBE_HOST, TRUST_PROBE_PORT);
  try {
    await nativeTransport.setAllowSelfSigned(TRUST_PROBE_HOST, TRUST_PROBE_PORT, true);
    const allowed = await nativeTransport.getAllowedHosts();
    await nativeTransport.setAllowSelfSigned(TRUST_PROBE_HOST, TRUST_PROBE_PORT, false);
    const revoked = await nativeTransport.getAllowedHosts();
    console.info(
      `[hwp-transport] trust policy add=${allowed.includes(probeKey)} revoke=${!revoked.includes(probeKey)}`,
    );
  } catch (error) {
    console.warn(`[hwp-transport] trust policy probe failed: ${describe(error)}`);
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
