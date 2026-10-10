#!/usr/bin/env bash
# The 1940s mathematician (character reference = the user's photo, uploaded
# once as REF). Tries free-plan models that accept image references.
# Usage: bash gen-1940s.sh <name> "<pose text>" [extra --image <uuid>]
cd "$(dirname "$0")"
REF=c313945b-b5f1-4132-8f0e-6e172beedd36
name="$1"; pose="$2"; shift 2
P="The man from the reference photo (same face, full white beard, swept-back silver hair, round dark sunglasses) reimagined as a 1940s mathematician in a grey-brown tweed three-piece suit, loose knitted tie, white shirt. He sits on a rounded stone, profile facing right, $pose Matte tempera painting, flat stylized symbolist illustration in the style of Ciurlionis and Roerich, not a photo. Muted indigo, slate blue, violet, lavender; pearl-white beard. Full body, isolated on a flat plain pale grey background, no ground, no text."
for m in seedream_5_0_flash kling_omni_image seedream_v5_lite grok_image; do
  for try in $(seq 1 20); do
    higgsfield generate create $m --image $REF "$@" --aspect_ratio 3:4 --prompt "$P" --wait --json > "$name.json" 2> "$name.err"
    grep -q rate_limit "$name.err" || break; sleep 15
  done
  if grep -q basic_plan "$name.err"; then echo "$m needs paid plan"; continue; fi
  break
done
u=$(grep -o '"result_url": *"[^"]*"' "$name.json" | head -1 | sed 's/.*: *"//; s/"$//')
if [ -n "$u" ]; then curl -sL "$u" -o "$name.png"; echo "ok $name via $m"; else echo "FAILED $name"; cat "$name.err"; fi
