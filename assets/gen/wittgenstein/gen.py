# PARKED — see docs/parked/Wittgenstein figure.md
# Two-image edit on the Qwen-Image-Edit-2511 Hugging Face Space (free ZeroGPU).
# Last run (2026-10-14) failed: "requested GPU duration (360s) is larger than
# the maximum allowed" — the free-account per-call cap. Try a Fast/Lightning
# Space or run locally instead (options in the parked note).
# Run: uv run --with gradio_client python gen.py <down|up> [seed] [tag]
import sys, os, shutil, time
from gradio_client import Client, handle_file

HERE = os.path.dirname(os.path.abspath(__file__))
pose = sys.argv[1] if len(sys.argv) > 1 else "down"
seed = int(sys.argv[2]) if len(sys.argv) > 2 else 7
tag = sys.argv[3] if len(sys.argv) > 3 else ""

look = ("head bowed, looking down at the notebook while writing" if pose == "down"
        else "head tilted back, gazing up at the night sky in wonder, pen resting on the page")

PROMPT = (
    "Replace the old bearded man in image 1 with the man from image 2: same face as image 2, "
    "clean-shaven, no beard, no moustache, no glasses, short dark wavy hair, about forty years old. "
    f"Keep exactly the pose, framing and composition of image 1: sitting on the same painted stone, {look}, "
    "the same open notebook resting on his knee, the same pen in his right hand, same hands, same shoes position. "
    "Clothing: green herringbone tweed jacket like image 2, pale mustard-yellow open-collar shirt, "
    "grey wool trousers, brown leather shoes. "
    "Keep the matte tempera painting style of image 1 with soft brush texture and muted night-blue light. "
    "Plain flat pale grey background, nothing else."
)

c = Client("Qwen/Qwen-Image-Edit-2511")
t0 = time.time()
res, used_seed = c.predict(
    images=[{"image": handle_file(os.path.join(HERE, f"figure-{pose}.png"))},
            {"image": handle_file(os.path.join(HERE, "wittgenstein.png"))}],
    prompt=PROMPT, seed=seed, randomize_seed=False, true_guidance_scale=4.0,
    num_inference_steps=40, height=1264, width=896, rewrite_prompt=False,
    api_name="/infer",
)
out = os.path.join(HERE, f"w-{pose}-{seed}{tag}.png")
src = res[0]["image"] if isinstance(res[0].get("image"), str) else res[0]["image"]["path"]
shutil.copy(src, out)
print("ok", out, "seed", used_seed, f"{time.time() - t0:.0f}s")
