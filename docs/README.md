---
project: winenpot.github.io
type: project-home
updated: 2026-10-14
---

# winenpot.github.io — project home

This folder is the project's own Obsidian vault and its docs. To open it in
Obsidian, pick "Open folder as vault" and choose `docs/`. Coding agents start
from `../AGENTS.md`, which points back here. The global vault only
has a short pointer note: `Projects/winenpot.github.io` in
`C:/Users/crusa/OneDrive/Documents/Obsidian Vault`.

## What this is

Ashkan Ranjbar's personal site, published under the name Vincent Law. It is a
home on the web for long-form writing, short journal entries, case studies of
past work, and live ML demos (HF Spaces / Gradio / Streamlit / Render APIs)
that run on the page.

- Live: https://winenpot.github.io
- Repo: https://github.com/winenpot/winenpot.github.io (deploys on push to `main`)
- Local: `C:/Users/crusa/Code/winenpot.github.io`
- Original plan and page list: `../PLAN.md`

## Stack

- Astro 7, static output, pnpm. The project `.npmrc` points at registry.npmjs.org
  because the global mirror returns 402.
- Content collections: `src/content/{writing,journal,work,lab}`. KaTeX math, Shiki code.
- Deploy: GitHub Actions → GitHub Pages (`.github/workflows/deploy.yml`, Node 26).
- Identity knobs: `src/config/site.ts`. Floating math figures: `src/config/figures.ts`.
- Painted art (Higgsfield): `src/assets/art/`. Generation scripts: `assets/gen/`.
- Checks: `pnpm run check`, `pnpm run build`. Dev: `pnpm dev`.

## Design direction (short)

"Ciurlionis night" palette: slate, indigo, violet, lavender, with starlight as
the only warm note. Govacho bento DNA: dashed inner frame (the corner notch was dropped; clickable cards lift and wobble once on hover). A
math-notebook layer on top: three canvas figures (Euler, Gaussian, Fibonacci)
and a career wave. The colours stay. Type is self-hosted Arsenica (display,
numerals) + Caldina (body). Stats are clickable numbers with a damped wobble.
The footer has Wittgenstein on a stone, with Khayyam's quote kept.

## Notes

- [[Redesign pass]]: the 2026-10-14 redesign, now live. Its "Remaining
  before calling it finished" list (OG image, sample posts, portrait, §5
  UX pass) is the to-do list.
- [[Wittgenstein figure]]: live in the footer since 2026-10-20. The
  generation pipeline (free FLUX.1 Kontext on Hugging Face) is documented there.

## Parked / future TODO

- [ ] Wittgenstein **up pose**. For now it's a copy of the down pose, so the
      cross-fade shows no change. Waiting on the Hugging Face free quota.
      Steps are in [[Wittgenstein figure]].
- [ ] Marks/drawings on his notebook page (PIL, no model needed).
