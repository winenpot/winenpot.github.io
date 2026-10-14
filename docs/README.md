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
the only warm note. Govacho bento DNA: notched cards, dashed inner frame. A
math-notebook layer on top: canvas figures, an equation ticker, a career wave.
The user likes the colours. Fonts and the LCD digits are to be replaced. The
page should become calmer and more minimal.

## Notes

- [[Redesign pass]]: open work from the 2026-10-14 review (performance,
  fonts, numbers, declutter), plus the measured performance baseline.
- [[Wittgenstein figure]] (parked): swap the footer mathematician for
  Wittgenstein and draw in his notebook.

## Parked / future TODO

- [ ] [[Wittgenstein figure]]: blocked on image tooling, see the note.
- [ ] Khayyam **look-up pose** (a head-only edit of `assets/gen/kd2.png`) to
      bring back the footer cross-fade. Same tooling blocker. Details in
      [[Redesign pass]] §2b.
