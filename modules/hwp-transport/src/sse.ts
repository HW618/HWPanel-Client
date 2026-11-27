/**
 * SSE log transport for 1Panel container/compose logs (verified v2.5.1).
 *
 * RN's EventSource cannot set headers, so we read `fetch`'s ReadableStream and
 * parse `text/event-stream` ourselves. Every event's data is base64; decode it
 * to UTF-8 before handing log lines to the UI.
 *
 * Contracts: contracts/api/container.md §4, contracts/api/compose.md §5.
 */

export interface SseMessage {
  event: string;
  data: string;
  id?: string;
}

const EVENT_BOUNDARY = /\r?\n\r?\n/;

/** Incremental SSE parser: feed decoded chunks, receive complete events. */
export class SseParser {
  private buffer = '';

  feed(chunk: string): SseMessage[] {
    this.buffer += chunk;
    const messages: SseMessage[] = [];

    let boundary = EVENT_BOUNDARY.exec(this.buffer);
    while (boundary != null) {
      const block = this.buffer.slice(0, boundary.index);
      this.buffer = this.buffer.slice(boundary.index + boundary[0].length);

      const message = parseEventBlock(block);
      if (message != null) {
        messages.push(message);
      }
      boundary = EVENT_BOUNDARY.exec(this.buffer);
    }

    return messages;
  }

  /** Dispatch a trailing event that was not followed by a blank line. */
  flush(): SseMessage[] {
    const block = this.buffer;
    this.buffer = '';
    const message = parseEventBlock(block);
    return message == null ? [] : [message];
  }
}

function parseEventBlock(block: string): SseMessage | null {
  const dataLines: string[] = [];
  let event = 'message';
  let id: string | undefined;

  for (const line of block.split(/\r?\n/)) {
    if (line.length === 0 || line.startsWith(':')) {
      continue;
    }

    const separator = line.indexOf(':');
    const field = separator === -1 ? line : line.slice(0, separator);
    let value = separator === -1 ? '' : line.slice(separator + 1);
    if (value.startsWith(' ')) {
      value = value.slice(1);
    }

    if (field === 'data') {
      dataLines.push(value);
    } else if (field === 'event') {
      event = value;
    } else if (field === 'id') {
      id = value;
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  return id === undefined
    ? { event, data: dataLines.join('\n') }
    : { event, data: dataLines.join('\n'), id };
}

/**
 * Decodes one SSE event payload. Multiple `data:` lines are each a base64
 * chunk; they are decoded independently and joined with newlines.
 * Non-base64 payloads pass through unchanged.
 */
export function decodeLogData(data: string): string {
  return data
    .split('\n')
    .map((line) => decodeBase64Utf8(line.trim()) ?? line)
    .join('\n');
}

const BASE64_VALUES = (() => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const values = new Map<string, number>();
  for (let index = 0; index < alphabet.length; index += 1) {
    values.set(alphabet.charAt(index), index);
  }
  return values;
})();

export function decodeBase64Utf8(input: string): string | null {
  const normalized = input.replace(/[\r\n\t ]/g, '');
  if (normalized.length === 0 || normalized.length % 4 !== 0) {
    return null;
  }

  const bytes: number[] = [];
  for (let index = 0; index < normalized.length; index += 4) {
    const chunk = normalized.slice(index, index + 4);
    const padding = chunk.endsWith('==') ? 2 : chunk.endsWith('=') ? 1 : 0;

    let value = 0;
    for (let offset = 0; offset < 4; offset += 1) {
      const character = chunk.charAt(offset);
      if (character === '=') {
        value = (value << 6) >>> 0;
        continue;
      }
      const mapped = BASE64_VALUES.get(character);
      if (mapped === undefined) {
        return null;
      }
      value = ((value << 6) | mapped) >>> 0;
    }

    bytes.push((value >> 16) & 0xff);
    if (padding < 2) {
      bytes.push((value >> 8) & 0xff);
    }
    if (padding < 1) {
      bytes.push(value & 0xff);
    }
  }

  return bytesToUtf8(bytes);
}

function bytesToUtf8(bytes: readonly number[]): string {
  let output = '';
  let index = 0;

  while (index < bytes.length) {
    const first = bytes[index] ?? 0;

    if (first < 0x80) {
      output += String.fromCharCode(first);
      index += 1;
    } else if (first < 0xe0) {
      output += String.fromCharCode(((first & 0x1f) << 6) | ((bytes[index + 1] ?? 0) & 0x3f));
      index += 2;
    } else if (first < 0xf0) {
      output += String.fromCharCode(
        ((first & 0x0f) << 12) |
          (((bytes[index + 1] ?? 0) & 0x3f) << 6) |
          ((bytes[index + 2] ?? 0) & 0x3f),
      );
      index += 3;
    } else {
      const codePoint =
        ((first & 0x07) << 18) |
        (((bytes[index + 1] ?? 0) & 0x3f) << 12) |
        (((bytes[index + 2] ?? 0) & 0x3f) << 6) |
        ((bytes[index + 3] ?? 0) & 0x3f);
      output += String.fromCodePoint(codePoint);
      index += 4;
    }
  }

  return output;
}

function bytesToAscii(bytes: Uint8Array): string {
  let output = '';
  for (const byte of bytes) {
    output += String.fromCharCode(byte);
  }
  return output;
}

export interface LogStreamOptions {
  signal?: AbortSignal;
}

/**
 * Reads an SSE response body and yields decoded log lines.
 * Cancelling the signal (or breaking out of the loop) releases the connection.
 */
export async function* readLogStream(
  body: ReadableStream<Uint8Array>,
  options: LogStreamOptions = {},
): AsyncGenerator<string> {
  const { signal } = options;
  const reader = body.getReader();
  const parser = new SseParser();
  let finished = false;

  try {
    while (true) {
      const result = await readWithAbort(reader, signal);
      if (result.done) {
        for (const message of parser.flush()) {
          yield decodeLogData(message.data);
        }
        finished = true;
        return;
      }

      for (const message of parser.feed(bytesToAscii(result.value))) {
        yield decodeLogData(message.data);
      }
    }
  } catch (error) {
    if (signal?.aborted) {
      return;
    }
    throw error;
  } finally {
    if (!finished) {
      await reader.cancel().catch(() => undefined);
    }
    reader.releaseLock();
  }
}

export interface OpenLogStreamOptions extends LogStreamOptions {
  headers?: Record<string, string>;
}

/**
 * Opens a log stream. `Accept: text/event-stream` is mandatory: without it the
 * panel replies `200 {code:200, data:null}` instead of streaming.
 */
export async function openLogStream(
  url: string,
  options: OpenLogStreamOptions = {},
): Promise<AsyncGenerator<string>> {
  const response = await fetch(url, {
    method: 'GET',
    headers: { ...options.headers, Accept: 'text/event-stream' },
    signal: options.signal,
  });

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/event-stream')) {
    throw new Error(`Unexpected log response content-type: ${contentType || '(none)'}`);
  }
  if (response.body == null) {
    throw new Error('Log response has no readable body');
  }

  return readLogStream(response.body as ReadableStream<Uint8Array>, {
    signal: options.signal,
  });
}

function readWithAbort(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  signal: AbortSignal | undefined,
): Promise<ReadableStreamReadResult<Uint8Array>> {
  if (signal == null) {
    return reader.read();
  }
  if (signal.aborted) {
    return Promise.reject(new AbortError());
  }

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      cleanup();
      reject(new AbortError());
    };
    const cleanup = () => signal.removeEventListener('abort', onAbort);

    signal.addEventListener('abort', onAbort, { once: true });
    reader.read().then(
      (result) => {
        cleanup();
        resolve(result);
      },
      (error: unknown) => {
        cleanup();
        reject(error);
      },
    );
  });
}

class AbortError extends Error {
  constructor() {
    super('aborted');
    this.name = 'AbortError';
  }
}
