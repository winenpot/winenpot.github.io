import numpy as np
from PIL import Image
from pymatting import estimate_foreground_ml

src = Image.open('kd2.png').convert('RGB')
alpha_img = Image.open('khayyam-masked-clean.png').split()[-1]

img = np.array(src).astype(np.float64) / 255.0
alpha = np.array(alpha_img).astype(np.float64) / 255.0

fg = estimate_foreground_ml(img, alpha)
fg_u8 = np.clip(fg * 255, 0, 255).astype(np.uint8)
alpha_u8 = np.clip(alpha * 255, 0, 255).astype(np.uint8)

out = np.dstack([fg_u8, alpha_u8])
out_img = Image.fromarray(out, mode='RGBA')
out_img.save('khayyam-decontam.png')

bg = Image.new('RGBA', out_img.size, (10, 11, 28, 255))
bg.alpha_composite(out_img)
bg.convert('RGB').save('preview-decontam.png')
print('ok', out_img.size)
