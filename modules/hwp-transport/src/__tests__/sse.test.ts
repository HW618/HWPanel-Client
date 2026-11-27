import { decodeBase64Utf8, decodeLogData, openLogStream, readLogStream, SseParser } from '../sse';

const b64 = (value: string) => Buffer.from(value, 'utf8').toString('base64');

function asciiStream(chunks: string[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(
          new Uint8Array(Array.from(chunk, (character) => character.charCodeAt(0))),
        );
      }
      controller.close();
    },
  });
}

describe('SseParser', () => {
  it('parses multiple events in one chunk', () => {
    const parser = new SseParser();
    const events = parser.feed('data: YQ==\n\ndata: Yg==\n\n');

    expect(events).toEqual([
      { event: 'message', data: 'YQ==' },
      { event: 'message', data: 'Yg==' },
    ]);
  });

  it('handles chunks split mid-event and CRLF framing', () => {
    const parser = new SseParser();

    expect(parser.feed('data: YQ')).toEqual([]);
    expect(parser.feed('==\r\n\r\n')).toEqual([{ event: 'message', data: 'YQ==' }]);
  });

  it('joins multi-line data and ignores comments', () => {
    const parser = new SseParser();
    const events = parser.feed(': keep-alive\nevent: log\ndata: YQ==\ndata: Yg==\n\n');

    expect(events).toEqual([{ event: 'log', data: 'YQ==\nYg==' }]);
  });

  it('flushes a trailing event at EOF', () => {
    const parser = new SseParser();
    parser.feed('data: YQ==');

    expect(parser.flush()).toEqual([{ event: 'message', data: 'YQ==' }]);
  });
});

describe('base64 log decoding', () => {
  it('decodes single and multi-line payloads to UTF-8', () => {
    expect(decodeBase64Utf8(b64('hello'))).toBe('hello');
    expect(decodeLogData(`${b64('line 1')}\n${b64('line 2')}`)).toBe('line 1\nline 2');
  });

  it('decodes Chinese log text', () => {
    const chinese = String.fromCharCode(0x65e5, 0x5fd7, 0x884c);
    expect(decodeBase64Utf8(b64(chinese))).toBe(chinese);
  });

  it('rejects malformed base64', () => {
    expect(decodeBase64Utf8('not base64!')).toBeNull();
    expect(decodeBase64Utf8('abc')).toBeNull();
  });
});

describe('readLogStream', () => {
  it('yields decoded log lines until the stream ends', async () => {
    const stream = asciiStream([`data: ${b64('hello')}\n\n`, `data: ${b64('world')}\n\n`]);

    const lines: string[] = [];
    for await (const line of readLogStream(stream)) {
      lines.push(line);
    }

    expect(lines).toEqual(['hello', 'world']);
  });

  it('flushes the last event when EOF has no blank line', async () => {
    const stream = asciiStream([`data: ${b64('tail')}`]);

    const lines: string[] = [];
    for await (const line of readLogStream(stream)) {
      lines.push(line);
    }

    expect(lines).toEqual(['tail']);
  });

  it('stops promptly when the signal aborts', async () => {
    const controller = new AbortController();
    const stream = new ReadableStream<Uint8Array>({
      start(streamController) {
        streamController.enqueue(
          new Uint8Array(
            Array.from(`data: ${b64('first')}\n\n`, (character) => character.charCodeAt(0)),
          ),
        );
        // Intentionally never closes: mirrors a follow=true connection.
      },
    });

    const iterator = readLogStream(stream, { signal: controller.signal });
    await expect(iterator.next()).resolves.toEqual({ done: false, value: 'first' });

    const pending = iterator.next();
    controller.abort();

    await expect(pending).resolves.toEqual({ done: true, value: undefined });
  });
});

describe('openLogStream', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('always sends Accept: text/event-stream', async () => {
    const fetchMock = jest.fn(async () => ({
      headers: { get: () => 'text/event-stream; charset=utf-8' },
      body: asciiStream([`data: ${b64('line')}\n\n`]),
    }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const iterator = await openLogStream('https://panel.example.com/api/v2/containers/search/log', {
      headers: { 'Accept-Language': 'zh-CN' },
    });
    await expect(iterator.next()).resolves.toEqual({ done: false, value: 'line' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://panel.example.com/api/v2/containers/search/log',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Accept: 'text/event-stream' }),
      }),
    );
  });

  it('rejects the panel fake-success response', async () => {
    global.fetch = (async () => ({
      headers: { get: () => 'application/json' },
      body: asciiStream(['{"code":200,"message":"success","data":null}']),
    })) as unknown as typeof fetch;

    await expect(
      openLogStream('https://panel.example.com/api/v2/containers/search/log'),
    ).rejects.toThrow(/content-type/);
  });
});
