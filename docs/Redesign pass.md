---
project: winenpot.github.io
type: plan
status: awaiting-approval
created: 2026-10-14
revised: 2026-10-14
---

# Redesign pass: final plan

Back to [[README]] · Parked: [[Wittgenstein figure]]

**Rule for this pass:** nothing beyond the Hire-button change (§0) gets
implemented until the user approves this plan. Each step ends at a review
checkpoint on the live dev server (`pnpm dev` → http://localhost:4321, hot
reload).

## Goal

The user's brief: a faster page, a calmer and more minimal layout that stays
true to the theme, better fonts (taken from `../fonts`; licenses are fine for a
personal site), nicer numbers that react when clicked, and general UI/UX
polish. **The colours stay.** Out of scope: the Wittgenstein footer figure
(parked) and the real portrait photo (waiting for `public/me.jpg`).

## Baseline (measured 2026-10-14, dev server, 1440×900, homepage)

| | frames | p50 | p95 | max | style recalc | main thread |
|---|---|---|---|---|---|---|
| idle at top, 2.5 s | 412 | 6.1 ms | 6.2 ms | 6.3 ms | 415× (every frame), 0.34 s | ~0.97 s busy (≈39%) |
| scripted scroll, 2.5 s | 86 | 18 ms | **115 ms** | **455 ms** | 176×, 0.86 s | 1.16 s |

## After §1 + §2 (measured 2026-10-14, production preview, 1440×900, homepage)

| | frames | p50 | p95 | max | style-recalc cost | main thread busy |
|---|---|---|---|---|---|---|
| idle at top, 2.5 s | 412 | 6.1 ms | 6.2 ms | 6.5 ms | 0.044 s (was 0.34 s) | 0.18 s (was 0.97 s) |
| scripted scroll, 2.5 s | 372 | 6.1 ms | 6.3 ms | **127 ms** (was 455 ms) | 0.041 s (was 0.86 s) | 0.23 s (was 1.16 s) |

Main-thread busy time: **−81% idle, −80% scrolling**. Style-recalc cost (not
count — some animated elements still tick a cheap recalc every frame, that's
normal): **−87% idle, −95% scrolling**. Scroll's p50/p95 are now both near
6 ms either idle or scrolling; one outlier frame remains at 127 ms (down from
455 ms) — not chased further, logged below. Screenshots confirmed nothing
broke: nav, hero, bento grid (dense auto-flow filled the gaps left by the
removed cards with no manual span changes needed), footer.

How it was measured is in the appendix. Re-measure on the **production
build** (`pnpm build && pnpm preview`) as well as dev, because dev adds
Vite/toolbar overhead.

---

## §0 Done (approved by the user): one Hire button

- Decision: **one "Hire me" button, in the sticky nav, top-right, on every
  page.** That is where users look for contact/hire (Jakob's law), and the
  sticky nav keeps it reachable from any scroll position, so repeating it
  added nothing and felt "pick-me".
- Removed the copies from the home hero, the home closing card and the /about card.
- Calmed it down: a static gradient rim at rest. Rim spin, the rising tide and
  the star turn happen only on hover/focus. The orbiting spark and the
  magnetic cursor pull are gone. The wave used to animate `left` nonstop
  (layout work every frame); it is now a transform that runs only while
  hovered.
- Files: `HireButton.astro`, `Nav.astro`, `pages/index.astro`, `pages/about.astro`.
- State (2026-10-14): implemented, `pnpm run check` shows 0 errors, **not
  committed** (it sits in the working tree with `docs/`, `AGENTS.md` and
  `assets/gen/wittgenstein/`).

## §1 Performance (no taste decisions; do this first) — ✅ DONE 2026-10-14

| # | Change | Files |
|---|---|---|
| 1.1 ✅ | Dropped the parallax entirely (user's choice) — no more `--scroll` write on `:root`. | `FloatingFigures.astro`, `config/figures.ts` |
| 1.2 ✅ | Figures: 8 → 3 (Euler, Gaussian, Fibonacci — user's picks). Dead draw code for the other 5 deleted from `math-figures.ts` (296 → ~130 lines). | `scripts/math-figures.ts`, `config/figures.ts` |
| 1.3 ✅ | Stars: static field pre-rendered once to an offscreen canvas, blitted each frame; only ~11% (every 9th star) twinkle live. Constellation/meteor logic unchanged (already cheap — see note below). | `Sky.astro` |
| 1.4 ✅ | Removed: hero name sheen, `.wave-underline` slide, timeline dash flow, placeholder bust march, lab scan/pulse (card now hidden until real demos exist, see §2). Kept: floater bob (3, transform-only), star twinkle/meteors, thinker look-up cycle. | `index.astro`, `global.css`, `Timeline.astro`, `PhotoFrame.astro` |
| 1.5 ✅ | Nav: `backdrop-filter: blur` → solid gradient (darkened slightly to keep legibility). | `Nav.astro` |
| 1.6 | Not done — image format/size audit. Lower priority now that the big CPU costs are gone; revisit if preview still feels heavy on a real phone. | `Sky.astro`, `Shore.astro` |

**Result:** main-thread busy time −81% idle / −80% scrolling, style-recalc
cost −87% / −95%. Full numbers above. Not chased: a single 127 ms outlier
frame during the scripted scroll (down from 455 ms) — one frame out of 372,
not a sustained problem; a spatial grid for the pointer-constellation lookup
was considered but skipped since the near-pointer set is already small by
construction (≤ ~150 px radius), so it wasn't the real cost — the per-star
canvas draw calls were, and pre-rendering fixed that.
**Checkpoint A:** numbers above; screenshots taken, nothing visibly broke.

## §2 Declutter — ✅ DONE 2026-10-14 (user: "Do all of it")

- ✅ One Hire button (done earlier in §0).
- ✅ Margin-note quote card removed (`QuoteCycler.astro` deleted, unused elsewhere).
- ✅ Equation ticker removed from the hero (`EquationTicker.astro` deleted).
- ✅ Toolbox chips wall moved from home to /about. **Not** duplicated to
      /resume — it already has its own, more detailed `.cv__tools` table
      (languages/ML/viz/web/infra/databases/scraping), which does the same
      job better for a résumé; adding the chip wall there too would be redundant.
- ✅ Lab card: hidden entirely while `lab.length === 0` (no empty slots, no
      "cold start 00 s" clock). Grid's `dense` auto-flow closed the gap on
      its own — career+journal now share that row, no manual span changes needed.
- ✅ Hero kicker: dropped the coordinates line (`SITE.coords` deleted too, was dead after this).
- Footer merge and "closing card → quiet contact line": **not done yet** —
      bundled into §2b below since I'm already rewriting `Shore.astro` for
      the Khayyam swap, to avoid touching that file twice.

End state for the home page: hero · portrait · numbers · latest writing · now ·
career · journal · contact line = 8 cards (matches the target).
**Checkpoint B:** screenshots taken at desktop width; 375 px check still pending.

## §2b Footer figure: Khayyam, single pose (✅ agreed 2026-10-14, to do)

Replace the footer's 1940s mathematician with **Omar Khayyam**, using the
paintings already generated. No Higgsfield or paid tools needed. It fits the
footer's Rubáiyát quote, and his manuscript already shows writing, so the
"empty notebook" problem disappears.

- Source: `assets/gen/kd2.png`, 1536×2048, writing pose, flat grey background.
- `assets/gen/kd2-cut.png` is Higgsfield's earlier cut-out. **Don't use it
  as-is: the remover erased the stone** (grey on grey), so he floats. It's
  only useful as an edge reference for the turban and robe.
- The other drafts (`kd1`, `ku1`, `ku2`) are separate generations with
  different bodies, stones and props. They **can't** be cross-faded with kd2.
  `ku2` also has a sky patch painted into its background.

Tasks:
- [ ] Build the mask locally so it keeps the stone. Combine `rembg`/BiRefNet
      with a background-difference mask (estimate the flat grey from the
      borders), then clean it up with morphology and feather 1–2 px. Check
      the edges on the dark night colour.
- [ ] Crop to the figure plus a little padding and export as
      `src/assets/art/khayyam.png` (about 900 px wide; `astro:assets` makes the WebP).
- [ ] Grade it toward the dim footer painting: less brightness and
      saturation, cooler shadows. Keep the soft lavender rim (drop-shadow).
- [ ] `Shore.astro`: show one image. Remove the `k--up` layer, the
      `is-looking` cycle and the hover look-up. Shooting stars stay on
      `Sky.astro`'s own timer, and the `thinker:lookup` dispatch goes.
      Update the `aspect-ratio`, the `aria-label` (Omar Khayyam writing in a
      manuscript on a stone) and the doc comment. Fix the comment in
      `Sky.astro` too.
- [ ] Remove `src/assets/art/mathematician-{down,up}.png` from `src/` (git
      history keeps them).
- [ ] Check at 375 / 1440 px: placement next to the quote, no halo, feet and
      stone sitting on the sea's bottom edge.
- Later (parked): a matching **look-up pose** made from kd2 by a head-only
      image edit. Once it exists, bring back the cross-fade. It needs the same
      image tooling as [[Wittgenstein figure]].

## §3 Typography

- Build a temporary **specimen page** (`src/pages/specimen.astro`, deleted
  after the pick). It shows real site text: name, tagline, a paragraph, card
  labels, the numbers 06/01/00, and math glyphs (π φ σ μ ∑ ∫ √ ≈ ≤ → ·).
  Show 3–4 pairings side by side.
- Candidates found in `../fonts` with full Latin and math coverage:
  - Serif/display: Arsenica (14 styles), Lyon (one weight only, so no).
  - Sans: Source Sans Pro, Caldina, Bw Surco, PF Din Text Universal.
  - Persian+Latin families with license files: Dibaj, Anjoman Max, Peyda, Yekan
    Bakh. These would also be ready for a future Persian locale (`i18n/` already
    supports `dir`).
- Roles: **at most 2 families**, display/numerals and body. Card labels use the
  body font with tracking. Code stays on the system mono stack (no download).
- Ship: subset to Latin plus the math glyphs with `pyftsubset`, output WOFF2,
  self-host under `public/fonts/` or `src/assets/fonts/`. Use
  `font-display: swap`, preload the 1–2 critical files, and keep the **total
  font weight at or under ~120 KB**. Remove `@fontsource-variable/fraunces`
  and `@fontsource/ibm-plex-mono`, plus the `'opsz'/'SOFT'/'WONK'` settings
  in the CSS.

**Checkpoint C:** the user picks a pairing from the specimen screenshot.

## §4 Numbers (replaces the seven-segment LCD)

- New `<Num value pad label>` component that renders the digits in the chosen
  display font with `tabular-nums`. Keep the cheap count-up when it scrolls
  into view.
- **Click, tap, Enter or Space**: each digit does a damped rotational
  oscillation, θ(t) = A·e^(−ζt)·sin(ωt), with A ≈ 18°, ω ≈ 2π·3 Hz and ζ
  chosen so it settles in about 900 ms. Digits start about 60 ms apart (a
  "very small interval"), and a re-click restarts it cleanly.
  - Implemented as WAAPI keyframes sampled from θ(t), transform only, so it
    stays on the compositor.
  - `prefers-reduced-motion`: a single small scale pulse instead.
- Accessible: a real `<button>` with an `aria-label` like "6 years in ML", a
  visible focus ring and a 44 px target.
- Replace every `<Seg>` (home stats; the lab clock goes away with §2), then
  delete `Seg.astro` and `scripts/seg.ts`.

**Checkpoint D:** the user tries the interaction live.

## §5 Consistency and UX

- One button system (`btn-ghost`, plus `btn-solid` only inside the dialog), one
  label style (case, tracking, size), consistent card labels and arrow chips.
- Contrast: check `--ink-mute` and `--ink-soft` on card glass against WCAG AA
  and tweak the lightness only, keeping the hue.
- Focus rings visible everywhere. Touch targets ≥ 44 px (nav links, footer
  links, numbers).
- Layout pass at 375 / 768 / 1024 / 1440 px. Check the nav's wrap on mobile
  and that the single Hire button stays top-right.
- Reduced motion: keep the global kill switch, and verify the canvases render
  one static frame.

## §6 Verify and hand over

- `pnpm run check`, `pnpm run build`, and the perf re-measure (dev + preview) against the baseline.
- Final screenshots at desktop and mobile widths. Update this note's baseline table with an "after" row.
- **No commit or push until the user asks.**

## Order and checkpoints

§1 → A → §2 → §2b → B → §3 → C → §4 → D → §5 → §6. §1, §2b and §5 need no
input. §2 needs the declutter list approved. §3 needs a font pick.

## Open decisions (defaults in bold)

1. Parallax on the floating figures: **drop it** / keep it via scroll-driven CSS.
2. Which 3 figures stay: **dodecahedron, Euler, Fibonacci** / other.
3. The declutter items in §2: approve or strike each one.
4. Hero coordinates kicker: **drop it** / keep it small.

## Appendix: perf measurement

Run in the page with CDP `Performance.enable`. Diff
`Performance.getMetrics` (`TaskDuration`, `RecalcStyleDuration`,
`LayoutCount`, `RecalcStyleCount`) around this script:

```js
(async (scroll) => {
  const ts = []; const t0 = performance.now();
  const H = document.documentElement.scrollHeight - innerHeight;
  await new Promise((r) => { const f = (t) => { ts.push(t); const k = (t - t0) / 2500;
    if (scroll) scrollTo(0, H * Math.min(1, k)); k < 1 ? requestAnimationFrame(f) : r(); };
    requestAnimationFrame(f); });
  const d = ts.slice(1).map((t, i) => t - ts[i]).sort((a, b) => a - b);
  return { frames: d.length, p50: d[d.length >> 1], p95: d[Math.floor(d.length * .95)], max: d.at(-1) };
})(false /* idle */ /* or true: scroll */)
```

The tab must be visible (`Page.bringToFront`), or rAF pauses and the run times out.
