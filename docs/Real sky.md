---
project: winenpot.github.io
type: plan
status: live
created: 2026-10-22
---

# Real sky: true constellations, Mars and Earth

Back to [[README]]

> 2026-10-22: user approved the step-1 background ("the background is
> perfect"). Keep its look unchanged unless asked. Sound (step 3) was started
> and paused, not built: nothing exists for it yet.
> Later the same day the user dropped the footer sky caption + "Show me
> another sky" (and the footer contact line): the footer was too wordy.
> The snapshot data still carries place/date/time if it ever comes back.
>
> Related, same day: `src/components/CrowCursor.astro` replaces the desktop
> pointer with a crow that follows it and perches on a twig when the pointer
> rests. No dot or ring (user removed them); the crow's eyes turn red
> (`--crow-eye`) over anything clickable. Off on touch and with reduced
> motion; the
> native cursor stays on inputs, iframes, `[data-native-cursor]` and while a
> modal dialog is open.

## The idea (user's brief, 2026-10-22)

Replace the random star field with the real sky, naked-eye view. The footer
dunes are "home": either the Sahara or Mars, the stars look the same from
both. Only two planets: Mars (seen from the Sahara) and Earth (seen from
Mars). Accuracy may be soft. ~120 precomputed random snapshots ("ten dozen")
instead of a live sky, to stay light and feel curious. Standard (IAU)
constellations. Keep the painted planet in `sky-top.png`; follow the
paintings' rules. Sound: try it and see.

## Weight check (measured 2026-10-22, minified + gzip, esbuild)

| lib | gzip | verdict |
|---|---|---|
| three.js 0.186, small planet scene | 134 KB | only lazily, for the eyepiece (step 3) |
| howler 2.2.4 | 10 KB | fine; the audio file is the real cost |
| rapier3d-compat 0.21 | 1.65 MB | no: planets follow ephemerides, not physics |
| astronomy-engine 2.1.19 | 23 KB | build-time only (Python port), ships 0 KB |
| homepage before this | ~300 KB | |

## Step 1: real stars + figures + planet point. Live 2026-10-22

- `assets/gen/sky/build_sky.py` → `src/data/sky.json` (76 KB, 27 KB gzip).
  Run: `uv run --no-project --with astronomy-engine python assets/gen/sky/build_sky.py`.
  1,655 stars (mag ≤ 5 + any fainter figure star), 89 figures with Latin +
  Persian names (d3-celestial, BSD-3, vendored with its LICENSE), 120
  snapshots: 60 Sahara places with Mars up, 60 Mars sites (landing sites,
  Bagnold Dunes, Olympia Undae) with Earth up, dates 2026–2036, Sun well
  below the horizon, planet altitude 16–45°. Each snapshot is a 3×3 matrix
  (J2000 → north/east/up), so the browser needs no astronomy code.
  Self-checks: matrix path vs astronomy-engine `Horizon()` < 0.01°; Mars
  local noon = Sun highest; figure indices in range, longest segment < 35°
  (Carina's Canopus–Miaplacidus, 25.6°, is real).
- `Sky.astro`: stereographic projection (keeps figure shapes), horizon on
  the bottom edge; ~115° wide on desktop, ~43° on a phone. Figures faint;
  one lights up near the pointer, or one at a time when idle, with Latin +
  Persian name. Planet is a steady point (no twinkle), Mars `--sky-mars`,
  Earth `--periwinkle`. Stars twinkle less on Mars (thin air).
  **Painting rule:** the real planet sits on the painted planet's light
  beam (axis from (352, 910) in the 2048×1152 painting, 28° up-right),
  mapped through the image's `cover` + `30% 30%` fit.
  Snapshot kept per session (`sessionStorage`), new one per visit.
- `Shore.astro`: caption under the Khayyam quote ("Overhead: the real sky
  above …") + "Show me another sky ↻" (44 px).
- Perf (prod preview, 1440×900, 2.5 s): idle p95 6.2 ms, main thread
  0.21 s (was 0.18); scroll p95 6.2 ms, max 36.5 ms (was 127). Sky chunk
  31 KB gzip, non-blocking module.
- Verified: `pnpm run check` 0/0, `pnpm build`, 375 + 1440 px, reduced motion
  renders one static frame, no console errors.

## Next (each ends at a screenshot checkpoint)

1. Review step 1 visuals (line strength, label font, planet size).
2. Eyepiece: tap the planet → round "telescope" view with a 3D Mars/Earth,
   lit from the true Sun direction. three.js loaded only on first open, or a
   ~5 KB hand-written WebGL sphere. Painted/palette-tinted textures, ~512 px.
3. Sound, opt-in toggle, nothing loads until clicked: either a 30–60 s
   ambient loop (~200–350 KB, howler) or zero-byte Web Audio tones on
   constellation highlight. User wants to hear it before deciding.
