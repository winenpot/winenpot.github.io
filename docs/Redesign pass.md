---
project: winenpot.github.io
type: plan
status: live-remaining-polish
created: 2026-10-14
revised: 2026-10-20
---

> **State 2026-10-20:** §0–§4 are done, committed and live (last deploy
> fbdac88). The "Open decisions" at the bottom were all settled. What's left
> is in "Remaining before calling it finished" just below.

## Remaining before calling it finished

- [ ] Social preview image: `Base.astro` points at `/og.png`, which doesn't
      exist yet (1200×630).
- [ ] Sample content: `writing/hello-sky.md` and
      `journal/2026-10-11-first-night.md` are still `sample: true`.
- [ ] Portrait: `SITE.photo` / `SITE.aboutPhoto` are empty, so the
      placeholder shows (waiting for `public/me.jpg`).
- [ ] §5 consistency/UX pass, including the 375 px check (on mobile the nav
      cuts off "About").
- [ ] §6 perf re-measure and final screenshots.
- [ ] Wittgenstein up pose: see [[Wittgenstein figure]].
- [ ] Optional: `robots.txt`; decide on keeping the unused `src/assets/art/khayyam.png`
      and the untracked intermediates in `assets/gen/`.

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

## §2b Footer figure: Khayyam, single pose — ✅ DONE 2026-10-16

Replaced the footer's 1940s mathematician with **Omar Khayyam**, cut from
`assets/gen/kd2.png` (1536×2048, writing pose, flat grey background).

- Matting pipeline (`assets/gen/cut_khayyam*.py`, ad hoc venv via
  `uv venv --python 3.12.8`, since rembg/onnxruntime have no wheels for the
  pinned 3.14 interpreter): rembg (`isnet-general-use`) for the subject, a
  background-difference mask restricted to the lower-left quadrant to
  recover the stone (which rembg erased, same problem as `kd2-cut.png`),
  unioned and cleaned to the single largest connected component (dropped
  209 stray specks from background noise), then `pymatting.estimate_
  foreground_ml` to decontaminate the grey fringe at the alpha edge.
- `finish_khayyam.py`: cropped to the figure + stone with padding, graded
  toward the dim night footer (saturation ×0.82, brightness ×0.86, shadows
  tinted toward night-violet), resized to 900 px wide →
  `src/assets/art/khayyam.png` (900×1151).
- `Shore.astro`: one `<Image>`, no `k--up`/`k--down` layers, no
  `is-looking` cycle, no hover look-up, no `thinker:lookup` dispatch.
  `Sky.astro`'s shooting stars now run only on their own timer. Updated
  `aspect-ratio` (900/1151), `aria-label`, and both file doc comments.
- Removed `src/assets/art/mathematician-{down,up}.png` (git history keeps them).
- Checked at 375 / 1440 px: stone sits on the sea's edge, no halo, no overlap with footer text.
- Bundled in here (was pending since §2): the closing-card → quiet contact
  line merge. Removed the home page's `.closing` Card (duplicate Hire CTA);
  `Shore.astro` now has a `shore__contact` line with `SITE.hire.headline`,
  a mailto link and `SITE.hire.availability`, styled quietly between the
  quote and the footer nav.
- Later (parked): a matching look-up pose from kd2 by a head-only image
  edit, for the cross-fade. Needs the same image tooling as [[Wittgenstein figure]].

## §2c Card elevation system (user request, 2026-10-16) — ✅ DONE

Every card site-wide (they all go through `Card.astro`) now reads as one
of two kinds, decided purely by whether it has an `href`:

- **Clickable** (`.card--link`): bolder tone in the background gradient,
  baseline (un-reduced) glass transparency (`--glass-bold`), a solid tone
  border, and an outward drop shadow — reads as lifted off the page. Hover
  pushes this further (existing `translateY(-4px)` + wider notch).
- **Static** (`.card--static`, no `href`): dimmer tone, more transparent
  glass (`--glass-dim`), a faint dashed-frame border, and an **inward**
  box-shadow (`inset 0 3px 10px`) — reads as pressed into the page, no hover
  state (nothing to hover).

New tokens in `tokens.css`: `--glass-bold`, `--glass-dim`, `--line-dim`.
`Card.astro`'s `class:list` now emits `card--link` or `card--static`
(mutually exclusive) instead of a conditional `card--link` only.
Verified on the home bento (hero/portrait/stats/now are static and sit
duller; latest-writing/journal/lab pop forward) and on `/writing/`'s post
list (all clickable, all elevated).


## §3 Typography — ✅ DONE 2026-10-16

- Specimen page (`src/pages/specimen.astro`, now deleted) showed 4
  pairings, all on **Arsenica** for display/numerals (the only serif in
  `../fonts` with full Latin coverage and enough weights) against each
  sans candidate for body text: Source Sans Pro, Caldina, Bw Surco, PF Din
  Text Universal. **User picked B — Arsenica + Caldina.**
- Subset with `pyftsubset` (`assets/gen/.venv-font`, uv + fonttools +
  brotli, since the pinned 3.14 interpreter doesn't need to match for a
  pure-Python tool): Latin + Latin-1 + general punctuation + arrows/math
  operators for Arsenica (checked actual glyph coverage first — Arsenica
  has ∫ ≈ ≤ → · but not π φ σ μ √; those fall through to the `serif`
  fallback in `--font-display`, which is fine, that's what font-stack
  fallback is for), Latin + Latin-1 + punctuation only for Caldina (body
  text doesn't need math glyphs). 4 files, WOFF2: Arsenica regular/italic,
  Caldina regular/italic — **116 KB total**, under the ~120 KB budget.
  Only one weight each, so odd Fraunces-variable-axis weights (380, 340,
  250, 300 for `em`/italic accents) got simplified to 400 everywhere;
  the browser just uses the single registered face regardless.
- Self-hosted at `public/fonts/*.woff2`, declared in `src/styles/fonts.css`
  (`font-display: swap`), imported from `Base.astro`. Preloaded the two
  regular weights (`arsenica-regular.woff2`, `caldina-regular.woff2`) —
  the ones needed above the fold on every page.
- `tokens.css`: `--font-display: 'Arsenica', ...`, `--font-body: 'Caldina',
  ...`. `--font-mono` dropped IBM Plex Mono for the system mono stack
  (`ui-monospace, SFMono-Regular, Cascadia Mono, Consolas, monospace`) —
  no download, matches "code stays on system mono stack".
- Removed `@fontsource-variable/fraunces` and `@fontsource/ibm-plex-mono`
  from `package.json` (`pnpm remove`), and every `font-variation-settings`
  ('opsz'/'SOFT'/'WONK') in `global.css`, `Nav.astro`, `index.astro` — dead
  on a static font.
- Verified on `/`, `/about/`: Arsenica on h1-h4 and the hero name, Caldina
  on body copy and taglines, no failed font requests, no fraunces/plex-mono
  left in the network panel.

**Checkpoint C:** done — B picked from screenshots.

## §4 Numbers (replaces the seven-segment LCD) — ✅ DONE 2026-10-16

- `Num.astro`: a real `<button type="button">`, digits in `--font-display`
  (Arsenica) with `tabular-nums`, `aria-label` like "6 years in ML" (matches
  the plan's example verbatim). 44px+ touch target via an absolutely
  positioned `::before` hit-slop, so it doesn't change the tight digit
  layout. No custom `:focus-visible` — inherits the site-wide outline rule.
- `scripts/num.ts`: on first scroll into view (`IntersectionObserver`,
  threshold 0.4, same cubic-ease timing as the old `seg.ts`), counts up
  from 0. On click/tap — and Enter/Space for free, since it's a native
  `<button>` — every digit replays a damped rotational wobble,
  θ(t) = A·e^(−ζt)·sin(ωt) with A = 18°, ω = 2π·3 Hz, ζ = 5.2/s (tuned so
  the envelope is ~1% of A by 900 ms), sampled once into a WAAPI keyframe
  list (`transform: rotate()` only, stays on the compositor). Digits start
  60 ms apart; re-click cancels any running animation on each digit first,
  so it restarts cleanly instead of stacking. `prefers-reduced-motion`:
  skips the count-up and the wobble, plays one small scale-pulse instead.
  Verified both paths with real WAAPI state (`getAnimations()`), not just
  visually.
- Replaced every `<Seg>` on the home stats card. `DemoEmbed.astro`'s
  wake-up clock (ticks live seconds while a sleeping Space wakes — a
  genuinely different widget, not a static number) dropped its dependency
  on `scripts/seg.ts` too, now just a plain `tabular-nums` text node with
  `setInterval`, so `Seg.astro` and `scripts/seg.ts` could be deleted
  outright with no remaining references.

**Checkpoint D:** verified programmatically (WAAPI `getAnimations()` state
for both the normal and reduced-motion paths) since a single screenshot
can't show a 900 ms animation — confirmed running/staggered and confirmed
the reduced-motion fallback takes the pulse-only branch.

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

## Open decisions (settled: parallax dropped; figures Euler, Gaussian, Fibonacci; declutter all approved; kicker dropped)

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
