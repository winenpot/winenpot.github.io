# Demo proxy

A Cloudflare Worker that lets static lab demos call APIs that need a secret
key. The site can't hold secrets (anything in its JavaScript is public), so
a demo posts to `POST /demo/<id>` here instead, and this Worker adds the key.

What it guarantees (see `src/handler.ts`):
- answers only pages on `ALLOWED_ORIGINS` (CORS + `Origin` check)
- forwards only ids listed in `routes.json`; the upstream URL never comes from
  the request, so it is not an open proxy
- per-IP, per-demo rate limit (10/min, `wrangler.toml`), body size limit,
  upstream timeout
- `force` fields (model, `max_tokens`, …) override whatever the visitor sends,
  so a visitor can't raise your costs
- the key goes upstream only; upstream errors are summarised, never echoed
- one JSON log line per request (demo, status, latency), no bodies, no IPs

## Commands (from this folder)

| | |
|---|---|
| `pnpm install` | install (own lockfile; not part of the site build) |
| `pnpm test` | unit tests of the handler, plain Node |
| `pnpm typecheck` | TypeScript |
| `pnpm dev` | local Worker on http://localhost:8787 (copy `.dev.vars.example` to `.dev.vars` first) |
| `pnpm run deploy` | deploy to Cloudflare (`pnpm exec wrangler login` once) |

Secrets: `pnpm exec wrangler secret put ANTHROPIC_API_KEY` (never in a file).
`GET /health` returns `{"ok":true}`.

## Adding an API demo

1. Add an entry to `routes.json` (copy `ask-claude`): `upstream`, `auth` (which
   header carries which secret), optional `headers`, a `template` with
   `"{{field}}"` placeholders filled from the form, `force` for the fields
   you control, `pick` (path to the useful part of the reply, e.g.
   `content.[type=text].text`), `maxBodyBytes`, `timeoutMs`. Set `"enabled": true`.
2. Set its secret, deploy.
3. Add the demo on the site: `src/content/_templates/lab/_example-api-proxied.md`.

## Before relying on it from Iran

Whether `*.workers.dev` is reachable from Iranian networks is unknown. Check
from a phone on an Iranian network. A custom domain on Cloudflare is the
fallback.
