/**
 * Transport abstraction required by `docs/architecture.md` §2.
 *
 * Business code (features/*) depends on this interface only; the native
 * implementation lives in `modules/hwp-transport`. Real requests are added in
 * T05 — T01 only proves the module is linked and the per-instance TLS policy
 * can be configured.
 */

/** contracts/api/auth.md §6. */
export type AuthMode = 'api-key' | 'password';

export interface PanelEndpoint {
  /** `https` by default; plain HTTP is allowed by the product contract. */
  scheme: 'http' | 'https';
  /** Hostname without scheme or port, e.g. `panel.example.com` or `192.168.1.10`. */
  host: string;
  port: number;
  /**
   * Explicit opt-in for a self-signed certificate. The native side relaxes
   * trust for this `host:port` pair only; default is strict validation.
   */
  allowSelfSigned: boolean;
  /** Normalised security entrance (no surrounding slashes); sent as a login header only. */
  entrance?: string;
  /** TODO(T05): required once the connection form exists. */
  authMode?: AuthMode;
}

export interface PanelTransport {
  readonly endpoint: PanelEndpoint;
  /** Returns the native implementation identity, used to prove the module is linked. */
  ping(): Promise<string>;
  /** Pushes this instance's trust decision to the native layer. */
  applyTrustPolicy(): Promise<void>;
  // TODO(T05): request() and openLogStream() land with the real session layer.
}
