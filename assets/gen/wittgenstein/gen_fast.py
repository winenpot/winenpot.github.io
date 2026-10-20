# Wittgenstein swap on the free multimodalart/Qwen-Image-Edit-Fast Space
# (Qwen-Image-Edit + 8-step Lightning, single input image, ZeroGPU).
# Base: assets/gen/kd2.png (the Khayyam painting the footer is cut from).
#   mode "text":   edit kd2 alone, Wittgenstein described in words
#   mode "stitch": kd2 | reference photo side by side, then crop the left half
# Run: uv run --with gradio_client --with pillow python gen_fast.py <text|stitch> [seed]
import sys, os, shutil, time
from PIL import Image
from gradio_client import Client, handle_file

HERE = os.path.dirname(os.path.abspath(__file__))
GEN = os.path.dirname(HERE)
mode = sys.argv[1] if len(sys.argv) > 1 else "text"
seed = int(sys.argv[2]) if len(sys.argv) > 2 else 7
backend = sys.argv[3] if len(sys.argv) > 3 else "kontext"  # kontext | qwen

base = Image.open(os.path.join(GEN, "kd2.png")).convert("RGB").resize((768, 1024), Image.LANCZOS)

# v3: FLUX has no negative prompt, so naming "moustache"/"beard" (even as "no ...") draws one. Never name them.
LOOK = ("the philosopher Ludwig Wittgenstein at about forty: smooth freshly shaved face and bare skin above the lips, "
        "lean angular face, hollow cheeks, strong straight nose, intense deep-set light-blue eyes, "
        "short tousled curly dark hair cropped close at the sides, bareheaded")
CLOTHES = ("green herringbone tweed jacket, pale mustard-yellow open-collar shirt, "
           "grey wool trousers, brown leather shoes")
KEEP = ("Keep exactly the same pose, framing and composition: sitting on the same grey stone, head bowed, "
        "writing in the same open notebook on his knee with the same pen in his right hand. "
        "Keep the original matte tempera painting style exactly: soft visible brush strokes, muted colours, "
        "not photographic, and the plain flat pale grey background.")

if mode == "text":
    inp = os.path.join(HERE, "in-text.png")
    base.save(inp)
    prompt = f"Replace the man in a turban and blue robe with {LOOK}, wearing a {CLOTHES}. {KEEP}"
else:
    ref = Image.open(os.path.join(HERE, "wittgenstein.png")).convert("RGB")
    ref = ref.resize((round(ref.width * 1024 / ref.height), 1024), Image.LANCZOS)
    sheet = Image.new("RGB", (768 + ref.width, 1024), (214, 214, 220))
    sheet.paste(base, (0, 0)); sheet.paste(ref, (768, 0))
    inp = os.path.join(HERE, "in-stitch.png")
    sheet.save(inp)
    prompt = (f"In the left painting, replace the man in a turban and blue robe with the man from the photo on "
              f"the right: same face, {LOOK}, wearing a {CLOTHES}. {KEEP} Leave the right photo unchanged.")

tok = open(os.path.expanduser("~/.cache/huggingface/token")).read().strip()
t0 = time.time()
if backend == "qwen":  # 2026-10-20: every call fails with "ZeroGPU worker error"
    c = Client("multimodalart/Qwen-Image-Edit-Fast", token=tok, verbose=False)
    res, used_seed = c.predict(
        image=handle_file(inp), prompt=prompt, seed=seed, randomize_seed=False,
        true_guidance_scale=1.0, num_inference_steps=8, rewrite_prompt=False, api_name="/infer",
    )
else:
    c = Client("black-forest-labs/FLUX.1-Kontext-Dev", token=tok, verbose=False)
    res, used_seed = c.predict(
        input_image=handle_file(inp), prompt=prompt, seed=seed, randomize_seed=False,
        guidance_scale=2.5, steps=28, api_name="/infer",
    )
path = res if isinstance(res, str) else res.get("path")
out = os.path.join(HERE, f"wf-{backend}-{mode}-{seed}.png")
img = Image.open(path).convert("RGB")
img.save(out)
print("ok", out, img.size, "seed", used_seed, f"{time.time() - t0:.0f}s")
if mode == "stitch":
    left = img.crop((0, 0, round(img.width * 768 / (768 + ref.width)), img.height))
    left.save(out.replace(".png", "-left.png"))
    print("left", left.size)
