# Adding things to the site

Everything you add over time lives in this folder. Adding something means
adding or editing a file here, never touching code. `pnpm build` checks every
file against its schema (`src/schemas.ts`) and stops with the file name
and the bad field if something is missing or misspelled.

## Using /admin (the web form)

Everything below can also be done at **https://winenpot.github.io/admin**, a
form over these same files (Sveltia CMS, config in `public/admin/config.yml`).

- **Sign in:** "Sign In Using Access Token" with a GitHub fine-grained personal
  access token: *this repository only*, permission **Contents: read and
  write**, nothing else, 90-day expiry. It stays in that browser's storage;
  sign out on shared machines.
- **Save = publish.** Every save is a commit to `main`, and the site deploys
  in about a minute. Tick **Draft** to keep a post off the live site.
- **Safety net:** CI runs `pnpm run check`, `pnpm run check:cms` and the build
  before deploying, so a bad save fails there and the live site keeps its
  last good version (the Actions tab shows why).
- **Try it offline:** `pnpm dev`, open http://localhost:4321/admin in Chrome
  or Edge, choose "Work with Local Repository" and pick this folder. It edits
  the files on disk: no token, no commit, no deploy.

## By hand

Files starting with `_` are ignored everywhere, so you can keep drafts and
templates next to the real ones. `draft: true` hides a post from the live site
but keeps it on `pnpm dev`.

| To add…                | Do this                                                   | Shows up on |
|------------------------|-----------------------------------------------------------|-------------|
| an essay               | new `writing/<slug>.md`                                   | /writing, home, RSS, stats |
| a journal note         | new `journal/<yyyy-mm-dd-slug>.md`                        | /journal, home |
| a job                  | new `work/<company>.md`                                   | /work (tile + timeline), home, résumé, stats |
| a lab demo             | new `lab/<slug>.md` (see `_templates/lab/README.md`)        | /lab, home, stats |
| a footer quote         | new `quotes/<slug>.json` (see `quotes/README.md`)         | footer, random per page load |
| a "Now" line           | a line in `profile/now.yaml`                              | home |
| a certificate          | an entry in `profile/certificates.yaml`                   | /about, résumé |
| a degree / course      | `profile/education.yaml`                                  | /about, résumé |
| a skill                | `profile/skills.yaml` (`summary` = /about, `full` = résumé) | /about, résumé |
| a book / translation   | `profile/publications.yaml`                               | résumé |
| an interest            | `profile/interests.yaml`                                  | /about |
| the About story        | the body of `profile/about.md`                            | /about |

## Front matter, by type

**writing/** `title`, `description`, `date`; optional `tags`, `updated`, `draft`.

```md
---
title: Why my agents stopped calling the LLM
description: A Bayesian network did 95% of the work.
date: 2026-11-02
tags: [llm, agents]
---
The essay, in Markdown (KaTeX math works: $e^{i\pi}+1=0$).
```

**journal/** `title`, `date`; optional `mood`, `tags`, `draft`.

**work/** `title`, `org`, `role`, `start: "2025-02"`, `summary`; optional `end`
(leave it out for a current job), `metrics` (`- { value: "10×", label: faster CI/CD }`),
`tags`, `featured: true` (a wider tile), `tone`. The body is the case study shown
when the tile opens. Jobs sort by `start`, newest first.

**lab/** see `_templates/lab/README.md`. Hosted demos (Hugging Face, Gradio, Streamlit,
any iframe, a JSON API) need only the Markdown file. An API that needs a secret
key goes through the demo proxy (`proxy/README.md`, template
`_templates/lab/_example-api-proxied.md`); its form is built from `inputs`. A `native` demo also
needs its component in `src/components/demos/<Name>.astro`, which is
picked up by file name (`component: <Name>`), with no registry to edit.
Its markup gets `data-demo="<Name>"`; its logic goes in `<Name>.ts` as
`export function mount(root)`, which loads only when the tile is opened
(see `TSpanner.astro` / `TSpanner.ts`).

## What still lives in code, on purpose

`src/config/site.ts` holds one-time settings, not lists: your name, links,
photo, the hire-me copy, the résumé headline. Edit it rarely, by hand.
