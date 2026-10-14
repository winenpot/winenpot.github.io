# AGENTS.md: winenpot.github.io

Ashkan Ranjbar's personal site (published as "Vincent Law"): writing, a
journal, work case studies and live ML demos. Astro 7 static site on pnpm,
deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to
`main`. Live at https://winenpot.github.io.

## Start here (new session)

1. Read `docs/README.md`, the project home. `docs/` is also this project's
   Obsidian vault.
2. Active work: `docs/Redesign pass.md`. Check its `status:`. While it says
   `awaiting-approval`, implement nothing new. Ask the user the "Open
   decisions" at the bottom of that file, then follow its order and
   checkpoints (§1 → A → §2 → …).
3. Parked work lives in `docs/parked/`. Don't start it unless the user asks.
4. Run `git status` first, because earlier work may be uncommitted on purpose.

## Commands

- `pnpm install`. The repo `.npmrc` pins registry.npmjs.org, because the
  global mirror returns 402.
- `pnpm dev` serves http://localhost:4321. In Hermes, start it with
  `background=true` and a log file, or the terminal's server heuristic
  refuses it.
- `pnpm run check` (astro check) and `pnpm build`. Run both before calling work done.
- `pnpm preview` serves the production build. Use it for performance numbers.

## Rules

- **Never commit or push unless the user asks.** Pushing to `main` deploys the live site.
- The colour palette stays. Tokens live in `src/styles/tokens.css`; don't
  hard-code colours.
- There is exactly **one** "Hire me" button: `HireButton` in `Nav.astro`. Don't add others.
- Performance:
  - Never write CSS custom properties on `:root`/`html` from scroll or
    pointer handlers.
  - Animate only `transform`/`opacity`.
  - No infinite paint- or layout-heavy loops.
  - Canvases pause off-screen.
  - Measure before and after with the script in `docs/Redesign pass.md`
    (appendix).
- Respect `prefers-reduced-motion`. Mobile-first: check 375 px. Keep visible
  focus and 44 px touch targets.
- Fonts are self-hosted only. Never use the Google Fonts CDN (slow or blocked from Iran).
- The user judges visuals from screenshots. Show them before and after on
  the dev server.

## Knob map

- `src/config/site.ts`: identity, links, photo slots, hire copy, the "now" list, stack.
- `src/config/figures.ts`: which floating math figures appear and where.
  The drawing code is in `src/scripts/math-figures.ts`.
- `src/styles/tokens.css`: palette, type scale, spacing, motion, z-layers.
  `src/styles/global.css` holds the base and shared components.
- `src/i18n/ui.ts`: every UI string. `src/i18n/locales.ts`: languages.
- `src/content/{writing,journal,work,lab}/`: Markdown content. The schemas
  are in `src/content.config.ts`. Lab files starting with `_` are examples
  and are ignored.
- Painted art: `src/assets/art/`. Generation scripts and inputs: `assets/gen/`.

## Adding a language

So far only the plumbing exists, and the pages are not localized.
1. Uncomment or add the locale in `src/i18n/locales.ts` (label, `dir`, `htmlLang`).
   `astro.config.mjs` reads `LOCALE_CODES`.
2. Add a matching block of strings in `src/i18n/ui.ts`. Missing keys fall back to English.
3. Localized routes and pages, plus the content `lang` field, still need
   building. Plan that with the user first.

## Notes convention

Detailed notes, plans and parked TODOs go in `docs/` (the local vault). The
global vault (`C:/Users/crusa/OneDrive/Documents/Obsidian Vault`) only has
`Projects/winenpot.github.io.md`, a short pointer note. Update it when the
project's status changes.
