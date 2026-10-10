#!/usr/bin/env bash
# Painted assets for the site, generated with Higgsfield z_image (free plan:
# gpt_image_2_5 needs a paid plan). Style: Ciurlionis symbolism + Feininger
# prismatic geometry, dim blue/violet. Deliberately NOT Van Gogh.
# Usage: bash assets/gen/generate.sh <name> [<name> ...]
cd "$(dirname "$0")"

STYLE="early 20th-century European symbolist tempera painting in the manner of Mikalojus Ciurlionis's Sonata of the Stars cycle, crossed with Lyonel Feininger's crystalline prismatic geometry: matte tempera and pastel on paper, translucent layered veils, horizontal undulating wave-like bands, faceted prismatic rays of light cutting diagonally, a hushed dreamlike mystical mood, palette of dim slate blue, deep indigo, dusty violet, muted lavender and pale periwinkle, faint pearly white stars, no yellow, low contrast, soft paper grain"

# Objects/figures are painted on a flat plain background so the background
# remover can cut them out cleanly afterwards.
OBJ="painted in the same symbolist tempera style with muted indigo, violet, lavender and periwinkle tones and faint pearly highlights, matte pastel texture; a single isolated subject centered on a perfectly flat plain light grey background, nothing else in the frame, no shadow, no text"

declare -A AR P
AR[sky1]=16:9; P[sky1]="A vast quiet cosmic sky, $STYLE. Thin luminous geometric orbits and faint circles drawn like a celestial diagram, small stars arranged like constellations, a pale ringed planet low on the left. No land, no trees, no buildings, no people, no text, no signature."
AR[sky2]=16:9; P[sky2]="An endless night sea of air and stars seen from below, $STYLE. Rows of gentle translucent waves rising into the sky like a staircase, a tall faint pyramid of light, scattered pearly stars, crystalline beams. No land, no trees, no buildings, no people, no text, no signature."
AR[thinker]=3:4; P[thinker]="Full-body side view of a lone thoughtful mathematician-philosopher sitting on a low rounded stone, long dark indigo coat, scarf, head bowed over an open notebook on his knee, holding a pencil, a small brass compass on the stone, $OBJ."
FIG="a matte tempera painting on paper, flat stylized symbolist illustration with visible dry brush texture and simplified shapes, in the manner of Mikalojus Ciurlionis and Nicholas Roerich, not a photograph, not a 3D render, not a sculpture; muted indigo, slate blue, dusty violet and lavender only; the figure is isolated on a perfectly flat plain pale grey background, nothing else in the frame, no ground, no shadow, no text"
AR[thinker2]=3:4; P[thinker2]="A small lone bearded philosopher-mathematician in a long dark indigo coat sitting on a rounded stone in profile facing right, bent over an open notebook on his knee, pencil in hand, deep in thought, $FIG."
AR[thinker3]=3:4; P[thinker3]="A small lone bearded philosopher-mathematician in a long dark indigo coat sitting on a rounded stone in profile facing right, notebook on his knee, his head tilted back gazing up at the sky in wonder, $FIG."
KH="an 11th-century Persian astronomer, mathematician and poet, a man in his early forties in his prime, not old: white turban, short full dark-black beard with no grey, alert thoughtful dark eyes, olive skin, flowing layered robe in deep indigo and dusty violet with a pale sash, sitting in profile facing right on a low rounded stone, a small brass astrolabe resting beside him on the stone"
KS="Matte tempera painting on paper, flat stylized symbolist illustration in the manner of Ciurlionis and Roerich, not a photo. A Persian astronomer-poet of the 11th century, about forty years old, white turban, short dark beard, flowing indigo and violet robe, sitting in profile facing right on a rounded stone"
KE="a small brass astrolabe beside him. Muted indigo, slate blue, violet, lavender. Isolated on a flat plain pale grey background, no ground, no text."
# NOTE: z_image fails silently on long prompts (~>600 chars) — keep these short.
AR[khayyam-down]=3:4; P[khayyam-down]="$KS, bent over an open manuscript on his knee, reed pen in hand, $KE"
AR[khayyam-up]=3:4; P[khayyam-up]="$KS, manuscript on his knee, head tilted back gazing up at the stars in wonder, $KE"
AR[dodeca]=1:1; P[dodeca]="A floating translucent glass dodecahedron with faintly glowing edges, $OBJ."
AR[mobius]=1:1; P[mobius]="A floating Mobius strip ribbon with one gentle twist, $OBJ."
AR[armillary]=1:1; P[armillary]="A small antique armillary sphere of thin nested rings with a tiny glowing star at its center, no stand, $OBJ."
AR[compass]=1:1; P[compass]="An antique drafting compass (geometry dividers) with legs open, $OBJ."
AR[klein]=1:1; P[klein]="A floating Klein bottle of softly glowing blue glass whose neck passes through its own body, $OBJ."

for name in "$@"; do
  echo ">>> $name"
  for try in 1 2 3 4 5 6 7 8 9 10 11 12; do
    higgsfield generate create z_image --aspect_ratio "${AR[$name]}" --prompt "${P[$name]}" --wait --json > "$name.json" 2> "$name.err"
    grep -q rate_limit_reached "$name.err" || break
    sleep 15
  done
  url=$(grep -o 'https://[^"]*\.png' "$name.json" | head -1)
  if [ -n "$url" ]; then curl -sL "$url" -o "$name.png" && echo "ok $name"; else echo "FAILED $name"; cat "$name.err"; fi
done
echo DONE
