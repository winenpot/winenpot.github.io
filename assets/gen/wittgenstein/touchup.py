# Second-pass Kontext edit on a gen_fast.py result (e.g. shave a leftover moustache).
# Run: uv run --with gradio_client --with pillow python touchup.py <in.png> <out.png> "<instruction>" [seed]
import sys, os, time
from PIL import Image
from gradio_client import Client, handle_file
src, dst, instr = sys.argv[1], sys.argv[2], sys.argv[3]
seed = int(sys.argv[4]) if len(sys.argv) > 4 else 7
tok = open(os.path.expanduser("~/.cache/huggingface/token")).read().strip()
c = Client("black-forest-labs/FLUX.1-Kontext-Dev", token=tok, verbose=False)
t0 = time.time()
res, _ = c.predict(input_image=handle_file(src), prompt=instr, seed=seed, randomize_seed=False,
                   guidance_scale=2.5, steps=28, api_name="/infer")
Image.open(res if isinstance(res, str) else res["path"]).convert("RGB").save(dst)
print("ok", dst, f"{time.time() - t0:.0f}s")
