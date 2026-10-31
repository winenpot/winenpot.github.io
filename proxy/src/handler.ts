/**
 * The demo proxy's request handling, as a pure function (no Workers globals)
 * so it can be tested in plain Node with a fake upstream.
 *
 * Why it exists: the site is static, so it can't hold API keys. A lab demo
 * that needs a key posts to POST /demo/<id>; this looks <id> up in
 * routes.json, adds the secret, enforces limits and forwards the request.
 *
 * Guarantees, in order:
 *  - only browsers on ALLOWED_ORIGINS get an answer (CORS + Origin check)
 *  - only ids in routes.json are forwarded; the upstream URL never comes
 *    from the request, so this is not an open proxy
 *  - per-IP, per-demo rate limit; request body size limit; upstream timeout
 *  - `force` fields (model, max_tokens…) are set here and override the
 *    visitor's input, so a visitor can't raise your costs
 *  - the secret only ever goes upstream; error replies never echo it
 */

export type Route = {
  /** false = known but switched off (404), e.g. until its secret is set */
  enabled?: boolean;
  upstream: string;
  /** adds `<header>: <prefix><env[secret]>` to the upstream request */
  auth?: { header: string; secret: string; prefix?: string };
  headers?: Record<string, string>;
  /** upstream JSON body with "{{field}}" placeholders filled from the visitor's input;
   *  without it the visitor's JSON is forwarded as is */
  template?: unknown;
  /** fields set on the final body last, overriding anything the visitor sent */
  force?: Record<string, unknown>;
  /** path to the useful part of the upstream reply, e.g. "content.[type=text].text";
   *  the response is then { result } instead of the raw upstream body */
  pick?: string;
  maxBodyBytes?: number;
  timeoutMs?: number;
};
export type Routes = Record<string, Route>;

export interface RateLimiter { limit(o: { key: string }): Promise<{ success: boolean }> }
export interface Env {
  /** comma-separated, e.g. "https://winenpot.github.io,http://localhost:4321" */
  ALLOWED_ORIGINS: string;
  RATE_LIMITER?: RateLimiter;
  [secret: string]: unknown;
}

const DEFAULT_MAX_BODY = 16 * 1024;
const DEFAULT_TIMEOUT = 30_000;
type Primitive = string | number | boolean | null;

const json = (data: unknown, status: number, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', ...headers } });

function log(fields: Record<string, unknown>) {
  // one structured line per request; never bodies, never secrets, no IPs
  console.log(JSON.stringify({ at: 'demo-proxy', ...fields }));
}

/** Fill "{{name}}" placeholders in a JSON template with the visitor's values. */
export function fill(template: unknown, input: Record<string, Primitive>): unknown {
  if (typeof template === 'string') {
    const whole = template.match(/^\{\{(\w+)\}\}$/);
    if (whole) return input[whole[1]] ?? '';
    return template.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(input[k] ?? ''));
  }
  if (Array.isArray(template)) return template.map((t) => fill(t, input));
  if (template && typeof template === 'object') {
    return Object.fromEntries(Object.entries(template).map(([k, v]) => [k, fill(v, input)]));
  }
  return template;
}

/** Follow "a.0.[type=text].b": property names, array indexes, or the first element matching key=value. */
export function pick(value: unknown, path: string): unknown {
  let cur: unknown = value;
  for (const seg of path.split('.')) {
    if (cur == null) return undefined;
    const match = seg.match(/^\[(\w+)=([^\]]*)\]$/);
    if (match) {
      cur = Array.isArray(cur) ? cur.find((x) => x && typeof x === 'object' && String((x as Record<string, unknown>)[match[1]]) === match[2]) : undefined;
    } else {
      cur = (cur as Record<string, unknown>)[seg];
    }
  }
  return cur;
}

export async function handle(req: Request, env: Env, routes: Routes, upstreamFetch: typeof fetch = fetch): Promise<Response> {
  const url = new URL(req.url);
  if (req.method === 'GET' && url.pathname === '/health') return json({ ok: true }, 200);

  // 1. who's asking: only pages on our own origins
  const origin = req.headers.get('Origin') ?? '';
  const allowed = (env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!allowed.includes(origin)) return json({ error: 'origin not allowed' }, 403);
  const cors = { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' };

  // 2. which demo: only ids listed in routes.json
  const id = url.pathname.match(/^\/demo\/([a-z0-9-]+)$/)?.[1];
  const route = id ? routes[id] : undefined;
  if (!id || !route || route.enabled === false) return json({ error: 'unknown demo' }, 404, cors);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { ...cors, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' },
    });
  }
  if (req.method !== 'POST') return json({ error: 'use POST' }, 405, { ...cors, Allow: 'POST, OPTIONS' });

  // 3. how often: per visitor IP, per demo
  if (env.RATE_LIMITER) {
    const ip = req.headers.get('CF-Connecting-IP') ?? 'unknown';
    const { success } = await env.RATE_LIMITER.limit({ key: `${ip}:${id}` });
    if (!success) {
      log({ demo: id, status: 429 });
      return json({ error: 'too many requests, try again in a minute' }, 429, { ...cors, 'Retry-After': '60' });
    }
  }

  // 4. what: a small JSON object of plain values
  if (!(req.headers.get('Content-Type') ?? '').includes('application/json')) return json({ error: 'send JSON' }, 415, cors);
  const max = route.maxBodyBytes ?? DEFAULT_MAX_BODY;
  if (Number(req.headers.get('Content-Length') ?? 0) > max) return json({ error: 'request too large' }, 413, cors);
  const raw = await req.text();
  if (new TextEncoder().encode(raw).length > max) return json({ error: 'request too large' }, 413, cors);
  let input: Record<string, Primitive>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
    if (route.template && Object.values(parsed).some((v) => v !== null && typeof v === 'object')) throw new Error('nested input');
    input = parsed as Record<string, Primitive>;
  } catch {
    return json({ error: 'body must be a flat JSON object' }, 400, cors);
  }

  // 5. build the upstream request: template, then forced fields, then the secret
  const body = { ...((route.template ? fill(route.template, input) : input) as object), ...route.force };
  const headers: Record<string, string> = { 'content-type': 'application/json', ...route.headers };
  if (route.auth) {
    const secret = env[route.auth.secret];
    if (typeof secret !== 'string' || !secret) {
      log({ demo: id, status: 500, problem: `secret ${route.auth.secret} is not set` });
      return json({ error: 'demo not configured' }, 500, cors);
    }
    headers[route.auth.header] = (route.auth.prefix ?? '') + secret;
  }

  const t0 = Date.now();
  let upstream: Response;
  try {
    upstream = await upstreamFetch(route.upstream, {
      method: 'POST', headers, body: JSON.stringify(body),
      signal: AbortSignal.timeout(route.timeoutMs ?? DEFAULT_TIMEOUT),
    });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === 'TimeoutError';
    log({ demo: id, status: timedOut ? 504 : 502, ms: Date.now() - t0 });
    return json({ error: timedOut ? 'the demo took too long' : 'could not reach the demo' }, timedOut ? 504 : 502, cors);
  }
  log({ demo: id, status: upstream.status, ms: Date.now() - t0 });

  // 6. answer: upstream errors are summarised, never passed through verbatim
  if (!upstream.ok) return json({ error: 'the demo returned an error', status: upstream.status }, 502, cors);
  if (route.pick) {
    const data: unknown = await upstream.json().catch(() => undefined);
    const result = data === undefined ? undefined : pick(data, route.pick);
    const stop = data && typeof data === 'object' ? (data as Record<string, unknown>).stop_reason : undefined;
    return json({ result: result ?? null, ...(stop ? { stop_reason: stop } : {}) }, 200, cors);
  }
  const type = upstream.headers.get('content-type') ?? 'application/json';
  if (type.startsWith('image/')) return new Response(await upstream.arrayBuffer(), { status: 200, headers: { ...cors, 'content-type': type } });
  return new Response(await upstream.text(), { status: 200, headers: { ...cors, 'content-type': type.includes('json') ? 'application/json' : 'text/plain; charset=utf-8' } });
}
