import { describe, it, expect, vi } from 'vitest';
import { handle, fill, pick, type Env, type Routes } from '../src/handler';

const ORIGIN = 'https://winenpot.github.io';
const SECRET = 'sk-test-do-not-leak';
const routes: Routes = {
  echo: { upstream: 'https://upstream.test/echo' },
  llm: {
    upstream: 'https://upstream.test/llm',
    auth: { header: 'x-api-key', secret: 'API_KEY' },
    template: { messages: [{ role: 'user', content: '{{prompt}}' }] },
    force: { model: 'm', max_tokens: 10 },
    pick: 'content.[type=text].text',
    maxBodyBytes: 200,
  },
  off: { enabled: false, upstream: 'https://upstream.test/off' },
};
const env = (over: Partial<Env> = {}): Env => ({ ALLOWED_ORIGINS: `${ORIGIN},http://localhost:4321`, API_KEY: SECRET, ...over });
const req = (path: string, init: RequestInit & { origin?: string | null } = {}) => {
  const headers = new Headers(init.headers);
  if (init.origin !== null) headers.set('Origin', init.origin ?? ORIGIN);
  return new Request(`https://proxy.test${path}`, { method: 'POST', ...init, headers });
};
const post = (path: string, body: unknown, origin?: string) =>
  req(path, { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }, origin });
const okUpstream = (data: unknown) => vi.fn(async () => Response.json(data));

describe('demo proxy', () => {
  it('answers the healthcheck', async () => {
    const res = await handle(new Request('https://proxy.test/health'), env(), routes);
    expect(res.status).toBe(200);
  });

  it('rejects other origins and requests without an Origin', async () => {
    const up = okUpstream({});
    expect((await handle(post('/demo/echo', {}, 'https://evil.test'), env(), routes, up)).status).toBe(403);
    expect((await handle(req('/demo/echo', { origin: null }), env(), routes, up)).status).toBe(403);
    expect(up).not.toHaveBeenCalled();
  });

  it('answers the CORS preflight for an allowed origin', async () => {
    const res = await handle(req('/demo/echo', { method: 'OPTIONS' }), env(), routes);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('only forwards demo ids listed in routes.json, and not switched-off ones', async () => {
    const up = okUpstream({});
    expect((await handle(post('/demo/nope', {}), env(), routes, up)).status).toBe(404);
    expect((await handle(post('/demo/off', {}), env(), routes, up)).status).toBe(404);
    expect((await handle(post('/https://evil.test/x', {}), env(), routes, up)).status).toBe(404);
    expect(up).not.toHaveBeenCalled();
  });

  it('rate-limits per IP and demo', async () => {
    const limit = vi.fn(async () => ({ success: false }));
    const up = okUpstream({});
    const r = post('/demo/echo', {});
    r.headers.set('CF-Connecting-IP', '1.2.3.4');
    const res = await handle(r, env({ RATE_LIMITER: { limit } }), routes, up);
    expect(res.status).toBe(429);
    expect(limit).toHaveBeenCalledWith({ key: '1.2.3.4:echo' });
    expect(up).not.toHaveBeenCalled();
  });

  it('rejects bodies that are too large, not JSON, or not a flat object', async () => {
    const up = okUpstream({});
    expect((await handle(post('/demo/llm', { prompt: 'x'.repeat(500) }), env(), routes, up)).status).toBe(413);
    expect((await handle(req('/demo/echo', { body: 'hi', headers: { 'Content-Type': 'text/plain' } }), env(), routes, up)).status).toBe(415);
    expect((await handle(post('/demo/echo', [1, 2]), env(), routes, up)).status).toBe(400);
    expect((await handle(post('/demo/llm', { prompt: { nested: true } }), env(), routes, up)).status).toBe(400);
    expect(up).not.toHaveBeenCalled();
  });

  it('fills the template, forces fields over the input, adds the secret, picks the reply', async () => {
    const up = okUpstream({ content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: 'hello!' }], stop_reason: 'end_turn' });
    const res = await handle(post('/demo/llm', { prompt: 'hi', model: 'expensive', max_tokens: 99999 }), env(), routes, up);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ result: 'hello!', stop_reason: 'end_turn' });
    const [url, init] = up.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://upstream.test/llm');
    expect((init.headers as Record<string, string>)['x-api-key']).toBe(SECRET);
    // template output plus forced fields; the visitor's own model/max_tokens never reach upstream
    expect(JSON.parse(init.body as string)).toEqual({ messages: [{ role: 'user', content: 'hi' }], model: 'm', max_tokens: 10 });
  });

  it('never echoes the secret or the upstream error body', async () => {
    const up = vi.fn(async () => new Response(`bad key ${SECRET}`, { status: 401 }));
    const res = await handle(post('/demo/llm', { prompt: 'hi' }), env(), routes, up);
    expect(res.status).toBe(502);
    expect(await res.text()).not.toContain(SECRET);
  });

  it('fails closed when the secret is not set', async () => {
    const up = okUpstream({});
    const res = await handle(post('/demo/llm', { prompt: 'hi' }), env({ API_KEY: '' }), routes, up);
    expect(res.status).toBe(500);
    expect(up).not.toHaveBeenCalled();
  });

  it('turns an upstream timeout into 504', async () => {
    const up = vi.fn(async () => { throw new DOMException('timed out', 'TimeoutError'); });
    const res = await handle(post('/demo/echo', { a: 1 }), env(), routes, up);
    expect(res.status).toBe(504);
  });
});

describe('fill / pick', () => {
  it('fills whole-string and embedded placeholders without string-building JSON', () => {
    expect(fill({ a: '{{n}}', b: 'Hi {{name}}!', c: ['{{name}}'] }, { n: 3, name: '"}; drop' }))
      .toEqual({ a: 3, b: 'Hi "}; drop!', c: ['"}; drop'] });
  });
  it('picks by property, index and [key=value]', () => {
    const data = { content: [{ type: 'thinking' }, { type: 'text', text: 'yes' }] };
    expect(pick(data, 'content.[type=text].text')).toBe('yes');
    expect(pick(data, 'content.0.type')).toBe('thinking');
    expect(pick(data, 'content.[type=image].url')).toBeUndefined();
  });
});
