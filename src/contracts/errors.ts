/** Mirror of contracts/domain/errors.md §1. */
export type PanelErrorKind =
  | 'network'
  | 'timeout'
  | 'tls'
  | 'entrance'
  | 'auth'
  | 'captcha'
  | 'mfa'
  | 'forbidden-ip'
  | 'clock-skew'
  | 'version'
  | 'business'
  | 'unknown';

export interface PanelError {
  kind: PanelErrorKind;
  /** Upstream business key, when the panel provides one. */
  panelCode?: string;
  /** HTTP status; see contracts/README.md §5 (the panel always answers 200). */
  status?: number;
  /** Localised, user-facing copy (T05 owns the error catalogue). */
  message: string;
  retryable: boolean;
}
