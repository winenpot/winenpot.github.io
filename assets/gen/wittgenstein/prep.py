# PARKED — see docs/parked/Wittgenstein figure.md
# Prepares inputs for the figure swap:
#   figure-{down,up}.png : current painted figure flattened on flat pale grey
#   wittgenstein.png     : reference photo with the dark screenshot border cropped
# Run: uv run --with pillow --with numpy python prep.py
from PIL import Image
import numpy as np, os
HERE = os.path.dirname(os.path.abspath(__file__))
ART = os.path.normpath(os.path.join(HERE, "../../../src/assets/art"))

# 1) current painted figure, flattened on a flat pale grey (easy to cut out later)
for pose in ("down", "up"):
    im = Image.open(os.path.join(ART, f"mathematician-{pose}.png")).convert("RGBA")
    bg = Image.new("RGBA", im.size, (214, 214, 220, 255))
    bg.alpha_composite(im)
    bg.convert("RGB").save(os.path.join(HERE, f"figure-{pose}.png"))
    print(pose, im.size)

# 2) Wittgenstein photo: crop away the dark screenshot border
w = Image.open(os.path.join(HERE, "wittgenstein-source.png")).convert("RGB")
a = np.asarray(w).astype(int)
bright = a.mean(axis=2) > 70
cols = np.where(bright.mean(axis=0) > 0.5)[0]
rows = np.where(bright.mean(axis=1) > 0.5)[0]
box = (int(cols.min()) + 2, int(rows.min()) + 2, int(cols.max()) - 1, int(rows.max()) - 1)
w.crop(box).save(os.path.join(HERE, "wittgenstein.png"))
print("photo", w.size, "crop", box)
