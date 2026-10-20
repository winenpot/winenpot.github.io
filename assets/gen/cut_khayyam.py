import numpy as np
from PIL import Image, ImageFilter
from rembg import remove, new_session

src = Image.open('kd2.png').convert('RGB')
a = np.array(src).astype(np.int16)
h, w, _ = a.shape

# 1) rembg subject mask (foreground figure, may erase stone since it's also grey)
session = new_session('isnet-general-use')
cut = remove(src, session=session)
cut_a = np.array(cut)[:, :, 3].astype(np.float32) / 255.0

# 2) background-difference mask: anything far from the flat grey border color
border = np.concatenate([a[:20].reshape(-1,3), a[-20:].reshape(-1,3), a[:,:20].reshape(-1,3), a[:,-20:].reshape(-1,3)])
grey = border.mean(0)
dist = np.linalg.norm(a - grey, axis=2)
diff_mask = (dist > 18).astype(np.float32)

# restrict diff-mask recovery to the lower-left quadrant where the stone sits,
# to avoid picking up noise elsewhere in the flat background
ys, xs = np.mgrid[0:h, 0:w]
region = (xs < w * 0.75) & (ys > h * 0.45)
diff_mask = diff_mask * region

union = np.clip(cut_a + diff_mask, 0, 1)

mask_img = Image.fromarray((union * 255).astype(np.uint8), mode='L')
# clean up: close small holes, open small specks, then feather
mask_img = mask_img.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
mask_img = mask_img.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
mask_img = mask_img.filter(ImageFilter.GaussianBlur(1.4))

out = src.convert('RGBA')
out.putalpha(mask_img)
out.save('khayyam-masked-full.png')
mask_img.save('khayyam-mask.png')
print('done', out.size)
