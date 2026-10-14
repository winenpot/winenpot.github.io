---
project: winenpot.github.io
type: task
status: parked
created: 2026-10-14
---

# Wittgenstein figure (PARKED)

Back to [[README]]

> **Decision 2026-10-14:** the footer gets **Khayyam** now, as a single pose
> made from the existing paintings (see [[Redesign pass]] §2b). This
> Wittgenstein idea **stays parked** as a possible later replacement or
> addition. When it comes back, the art to replace will be
> `src/assets/art/khayyam.png`, not the `mathematician-*` files below.

## The ask (2026-10-14)

1. Replace the bearded 1940s mathematician sitting in the bottom-left of the
   footer with **Wittgenstein**. Use the reference photo: green herringbone
   tweed jacket, pale mustard open-collar shirt, short dark wavy hair,
   clean-shaven. Give him **grey trousers**. Keep the same painted tempera
   style, the stone, the notebook and the pen.
2. Draw **mysterious marks/drawings on his notebook page**. It currently reads
   as a blank page. Don't change the notebook's geometry.

## Where it lives

- Component: `src/components/Shore.astro`. Two poses cross-fade: `is-looking`
  every 7–15 s, and on hover. Each look-up also fires `thinker:lookup`, which
  makes `Sky.astro` shoot a meteor.
- Art: `src/assets/art/mathematician-{down,up}.png`, 900×1266, transparent
  background, about 1.3 MB each. **Both poses must share the exact canvas and
  geometry. Only the head may differ**, otherwise the cross-fade jumps.
- Also update the `aria-label` and the doc comment in `Shore.astro` (they say
  "1940s mathematician").
- Inputs and scripts: `assets/gen/wittgenstein/`
  - `wittgenstein-source.png`: the photo exactly as the user pasted it.
  - `wittgenstein.png`: the same photo with the border cropped (`prep.py` makes it).
  - `prep.py`: also writes `figure-{down,up}.png` (current art flattened on
    flat grey) as the edit inputs.
  - `gen.py`: the two-image edit call and the full prompt.
- Older pipeline for reference: `assets/gen/gen-1940s.sh` (Higgsfield
  `seedream_5_0_flash`, then `image_background_remover`).

## Why it's parked (state on 2026-10-14)

- **Higgsfield**: free plan with 0.75 credits (a Seedream 5.0 Flash image costs
  0.5). Every call returns a Cloudflare 403. This is not an account ban:
  Cloudflare-fronted traffic leaves from an Iranian IP
  (`https://www.cloudflare.com/cdn-cgi/trace` shows `loc=IR`,
  ip 5.212.140.110), while other traffic goes through the VPN (Baku, AZ). Fix:
  run the VPN in full-tunnel/TUN mode, or route `higgsfield.ai` and
  `cloudfront.net` through it. The trace must then show something other than
  `loc=IR`. Gemini, AI Studio and ChatGPT fail with the same 403.
- **Hugging Face** is reachable and a token is saved locally.
  `Qwen/Qwen-Image-Edit-2511` (ZeroGPU, takes 2 images) failed with "requested
  GPU duration (360s) is larger than the maximum allowed", the free-account
  per-call cap.
- **Not tried yet**: `multimodalart/Qwen-Image-Edit-Fast` and
  `prithivMLmods/Qwen-Image-Edit-2511-LoRAs-Fast` (8-step Lightning, probably
  under the cap), and `black-forest-labs/FLUX.1-Kontext-Dev`.

## Options when we come back (cheapest first)

1. A Fast Qwen Space: one free test call, `gen.py` with a different Space id or steps.
2. Higgsfield again, once the VPN routes Cloudflare. It needs ≥1 credit for
   two poses, so check credits first.
3. Local on the RTX 4060 Laptop (8 GB VRAM, driver 596.08 / CUDA 13.2, 16 GB
   RAM, about 89 GB free on C:):
   - **FLUX.1 Kontext dev GGUF Q4** (about 6.8 GB) + T5 fp8 (about 4.9 GB) +
     CLIP-L/VAE (about 0.6 GB): about 12 GB of models plus about 4 GB of venv
     (torch CUDA + ComfyUI or diffusers). Roughly 1–2 min per 1024 px image.
     It takes one input image, so stitch the figure and the photo side by side.
   - Qwen-Image-Edit-2511 GGUF Q4: about 18–20 GB. Tight with 16 GB RAM, slow.
4. Cut-out: `rembg` locally (free), or Higgsfield's background remover.

## Notebook drawings: no model needed

Draw the ink marks straight onto the page with PIL. Warp them into the page
quad (perspective transform) so the notebook's geometry stays exactly as it
is, and apply the same overlay to both poses. The page sits at about x 440–795,
y 635–710 on the 900×1266 canvas; measure the exact quad first. Theme ideas:
the duck–rabbit, Tractatus numbering (`6.54`, `7`), a tiny truth table, a
ladder, a fragment of "Wovon man nicht sprechen kann…". This can be done before
the figure swap, or reapplied after it.

## Done when

- [ ] New `mathematician-{down,up}.png` (or renamed `wittgenstein-*`):
      900×1266, transparent, aligned, only the head differs
- [ ] Grey trousers, tweed jacket, mustard shirt, style matches the sky/sea palette
- [ ] Notebook shows marks in both poses, geometry unchanged
- [ ] `Shore.astro` label and comment updated, and the hover/look-up cycle checked
