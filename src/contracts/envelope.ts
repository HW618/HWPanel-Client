/**
 * Mirror of contracts/README.md §5.
 *
 * HTTP status is always 200 on the panel, including unauthenticated replies.
 * Success/failure is decided only by `code`.
 */
export interface PanelEnvelope<T> {
  /** 200 = success. */
  code: number;
  message: string;
  data: T;
}
