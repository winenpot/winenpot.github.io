# Cut out + grade the Wittgenstein footer poses (same pipeline as Khayyam:
# rembg isnet + flat-background difference, largest component, pymatting
# decontamination, night grade). All poses share ONE crop box so they stay
# pixel-aligned for the Shore.astro cross-fade.
# Run: uv run --python 3.12 --with rembg --with onnxruntime --with pymatting --with scipy --with pillow \
#        python cut_wittgenstein.py down=wf-stitch-7-shaved.png [up=wf-up-7.png]
import sys, os
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from scipy import ndimage
from rembg import remove, new_session
from pymatting import estimate_foreground_ml

HERE = os.path.dirname(os.path.abspath(__file__))
ART = os.path.normpath(os.path.join(HERE, "../../../src/assets/art"))
poses = dict(a.split("=", 1) for a in sys.argv[1:])
session = new_session("isnet-general-use")


def cut(path):
    src = Image.open(os.path.join(HERE, path)).convert("RGB")
    rgb = np.asarray(src).astype(np.float64)
    a_rem = np.asarray(remove(src, session=session, only_mask=True)).astype(np.float64) / 255
    # flat grey background: estimate it from the border, keep anything that differs from it
    border = np.concatenate([rgb[:12].reshape(-1, 3), rgb[-12:].reshape(-1, 3),
                             rgb[:, :12].reshape(-1, 3), rgb[:, -12:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    diff = np.linalg.norm(rgb - bg, axis=2)
    a_diff = np.clip((diff - 14) / 16, 0, 1)
    a_diff = np.asarray(Image.fromarray((a_diff * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5))) / 255
    # only trust the difference mask on the stone (lower-left); elsewhere it picks up the floor shadow
    H, W = diff.shape
    region = np.zeros_like(a_diff); region[int(H * 0.55):int(H * 0.93), : int(W * 0.5)] = 1
    region = np.asarray(Image.fromarray((region * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(12))) / 255
    alpha = np.maximum(a_rem, a_diff * region)
    alpha = np.clip((alpha - 0.12) / 0.88, 0, 1)  # choke the soft rim a little (light halo on dark bg)
    # keep the largest connected component (figure + stone), fill holes
    lab, n = ndimage.label(alpha > 0.5)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
        keep = ndimage.binary_fill_holes(lab == (np.argmax(sizes) + 1))
        keep = ndimage.binary_dilation(keep, iterations=3)
        alpha = alpha * keep
    fg = estimate_foreground_ml(rgb / 255, alpha)
    return np.dstack([np.clip(fg * 255, 0, 255), alpha * 255]).astype(np.uint8)


def grade(rgba):
    im = Image.fromarray(rgba, "RGBA")
    rgb = im.convert("RGB")
    # photographic Kontext output is brighter/more saturated than the tempera art: grade a bit harder than Khayyam
    rgb = ImageEnhance.Color(rgb).enhance(0.74)
    rgb = ImageEnhance.Brightness(rgb).enhance(0.84)
    rgb = ImageEnhance.Contrast(rgb).enhance(0.97)
    arr = np.asarray(rgb).astype(np.float64)
    tint = np.array([70, 70, 110], dtype=np.float64)
    w = np.clip(1 - arr.mean(axis=2, keepdims=True) / 255, 0, 1) ** 1.6 * 0.24
    arr = arr * (1 - w) + tint * w
    return np.dstack([np.clip(arr, 0, 255), rgba[:, :, 3]]).astype(np.uint8)


cuts = {k: cut(v) for k, v in poses.items()}
ref = next(iter(cuts.values()))
H, W = ref.shape[:2]
union = np.zeros((H, W), bool)
for c in cuts.values():
    assert c.shape[:2] == (H, W), "poses must share the same canvas"
    union |= c[:, :, 3] > 8
ys, xs = np.where(union)
pad = 20
box = (max(xs.min() - pad, 0), max(ys.min() - pad, 0), min(xs.max() + pad, W), min(ys.max() + pad, H))
for k, c in cuts.items():
    out = Image.fromarray(grade(c), "RGBA").crop(box)
    tw = 900
    out = out.resize((tw, round(out.height * tw / out.width)), Image.LANCZOS)
    out.save(os.path.join(ART, f"wittgenstein-{k}.png"), optimize=True)
    prev = Image.new("RGBA", out.size, (10, 11, 28, 255)); prev.alpha_composite(out)
    prev.convert("RGB").save(os.path.join(HERE, f"wf-preview-{k}.png"))
    print(k, out.size)
