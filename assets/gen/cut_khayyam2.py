import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

mask_img = Image.open('khayyam-mask.png')
m = np.array(mask_img)
binm = (m > 40)

# keep only the largest connected component (figure + stone are touching)
lbl, n = ndimage.label(binm, structure=np.ones((3,3)))
if n > 0:
    sizes = ndimage.sum(binm, lbl, range(1, n + 1))
    biggest = np.argmax(sizes) + 1
    clean = (lbl == biggest)
else:
    clean = binm

clean_u8 = (clean * 255).astype(np.uint8)
clean_img = Image.fromarray(clean_u8, mode='L')
# smooth the silhouette edge a touch, then feather for a soft edge
clean_img = clean_img.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
clean_img = clean_img.filter(ImageFilter.GaussianBlur(1.6))

src = Image.open('kd2.png').convert('RGBA')
src.putalpha(clean_img)
src.save('khayyam-masked-clean.png')

bg = Image.new('RGBA', src.size, (10, 11, 28, 255))
bg.alpha_composite(src)
bg.convert('RGB').save('preview-clean.png')
print('components found:', n)
