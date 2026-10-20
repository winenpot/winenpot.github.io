import numpy as np
from PIL import Image, ImageEnhance

im = Image.open('khayyam-decontam.png')
a = np.array(im)
alpha = a[:, :, 3]
ys, xs = np.where(alpha > 8)
pad = 24
x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad, im.width)
y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, im.height)
cropped = im.crop((x0, y0, x1, y1))

# grade toward the dim night footer: pull down brightness/saturation, cool the shadows
rgb = cropped.convert('RGB')
rgb = ImageEnhance.Color(rgb).enhance(0.82)      # less saturated
rgb = ImageEnhance.Brightness(rgb).enhance(0.86) # dimmer
rgb = ImageEnhance.Contrast(rgb).enhance(1.03)

arr = np.array(rgb).astype(np.float64)
# cool shadows: push darker pixels slightly toward blue/violet (night palette)
night_tint = np.array([70, 70, 110], dtype=np.float64)
lum = arr.mean(axis=2, keepdims=True) / 255.0
shadow_w = np.clip(1.0 - lum, 0, 1) ** 1.6 * 0.22
arr = arr * (1 - shadow_w) + night_tint * shadow_w
arr = np.clip(arr, 0, 255).astype(np.uint8)

out = np.dstack([arr, np.array(cropped)[:, :, 3]])
out_img = Image.fromarray(out, mode='RGBA')

# resize to ~900px wide per the plan
target_w = 900
scale = target_w / out_img.width
out_img = out_img.resize((target_w, round(out_img.height * scale)), Image.LANCZOS)
out_img.save('../../src/assets/art/khayyam.png')

bg = Image.new('RGBA', out_img.size, (10, 11, 28, 255))
bg.alpha_composite(out_img)
bg.convert('RGB').save('preview-final.png')
print('final size', out_img.size)
