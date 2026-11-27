/**
 * SSE log streaming lives in the local module's JS layer because it needs the
 * same headers as `PanelTransport` and must not fall back to global
 * EventSource. T05 wires it into `PanelTransport.openLogStream()`.
 */
export {
  decodeBase64Utf8,
  decodeLogData,
  openLogStream,
  readLogStream,
  SseParser,
} from '../../../modules/hwp-transport';
export type {
  LogStreamOptions,
  OpenLogStreamOptions,
  SseMessage,
} from '../../../modules/hwp-transport';
