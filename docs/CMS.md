---
project: winenpot.github.io
type: plan
status: built-awaiting-user-steps
created: 2026-10-31
---

# CMS, lab scaling and the demo proxy

Back to [[README]]

**Goal:** add content like posting on a platform (a web form that commits to
the repo), keep /lab fast with ~100 demos, and give demos that need an API key
a safe place to keep it.

## What was built (2026-10-31, uncommitted)

**A. CI guard.** `deploy.yml` runs `pnpm run check` and `pnpm run check:cms`
before the build. A bad save fails the job; the live site keeps its last
good version. `scripts/check-cms.ts` reads the real Zod schemas
(`src/schemas.ts`, split out of `content.config.ts` so Node can import them)
and compares every field, nested lists included, with `public/admin/config.yml`.
Its first run found a real bug: `education.start` used `z.coerce.string()`,
which turned a missing year into the text "undefined".

**B. Sveltia CMS at /admin.** MIT, bundled from npm (no CDN, no Google Fonts;
only optional extras such as code highlighting in the editor would reach
unpkg). Token sign-in only (`auth_methods: [token]`), so no OAuth server.
Saves commit to `main` with emoji messages. Lab examples moved out of the
collection folder to `src/content/_templates/lab/`. `/admin` is `noindex` and
left out of the sitemap.

**C. Grid scaling (ExpandGrid).**
- C1: only the focal tile and tiles within ±half a viewport get a
  `view-transition-name`; the rest hide or appear without a snapshot.
- C2: native demos split into markup (`<Name>.astro`, `data-demo`) and logic
  (`<Name>.ts`, `mount(root)`), loaded by a lazy `import.meta.glob` on
  `xtile:open`. Verified on the production build: /lab loads 0 demo chunks;
  opening t-spanner fetches exactly one.
- C3: `TagFilter` component on /writing, /lab, /work (`?tag=`). Found and
  fixed on the way: `[hidden]` never hid cards (their `display:flex` won), so
  the old /writing filter could not have worked; a reset-layer rule fixes it.

**D. Demo proxy (`proxy/`, Cloudflare Worker).** Route table in
`routes.json`, origin allowlist, per-IP rate limit (10/min), body/timeout
limits, server-side `force` fields, secret never echoed, JSON logs, `/health`.
12 unit tests in plain Node; checked end to end under `wrangler dev` with a
fake upstream and the real /lab form. Example route `ask-claude` (Claude
Opus 5.5, `anthropic-version: 2026-10-21`, refusal fallback on) ships
**disabled**. Site side: `kind: api` gained `proxy`, `inputs`, `output`;
`DemoEmbed` builds the form and shows the reply as text/JSON/image, never HTML.
`PUBLIC_DEMO_PROXY_URL` comes from the environment (`.env.example`, CI variable).

Deviation from the plan: tests use plain vitest on a pure `handle()` instead
of `@cloudflare/vitest-pool-workers`; the Workers runtime itself was covered
by the manual `wrangler dev` run.

## Waiting on the user

- [ ] Commit + push (deploys /admin and the rest).
- [ ] Create the fine-grained token (this repo, Contents: read & write, 90 days)
      and try /admin; first try local-repo mode on `pnpm dev`.
- [ ] When the first keyed demo is wanted: Cloudflare account, `wrangler login`,
      `wrangler secret put`, deploy, set the `PUBLIC_DEMO_PROXY_URL` repo variable,
      enable its route. Choose the model (the example uses Opus 5.5; Haiku 5.5 is
      the cheap option for a public demo).
- [ ] Check `*.workers.dev` reachability from an Iranian network.
- [ ] Delete the 4 `template-*.md` lab placeholders once real demos exist.

## Deferred

- Per-demo pages `/lab/<slug>/` (sharing, search).
- Re-measure with the perf script in [[Redesign pass]] once there are many tiles.
