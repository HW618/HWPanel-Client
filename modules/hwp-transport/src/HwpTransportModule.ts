import { NativeModule, requireNativeModule } from 'expo';

export declare class HwpTransportNativeModule extends NativeModule {
  readonly platform: 'ios' | 'android';
  /** Native identity, used to prove the local module is linked. */
  ping(): Promise<string>;
  /**
   * Per-instance TLS opt-in. Only this exact `host:port` pair is relaxed;
   * every other endpoint stays on system trust.
   */
  setAllowSelfSigned(host: string, port: number, enabled: boolean): Promise<void>;
  /** Sorted `host:port` keys currently relaxed. */
  getAllowedHosts(): Promise<string[]>;
}

export default requireNativeModule<HwpTransportNativeModule>('HwpTransport');
