# Lab demos

One Markdown file per live demo, in `src/content/lab/`. To start one, copy
one of the `_example-*.md` files here into `src/content/lab/`, drop the
underscore and fill it in (or use /admin → Lab → New Demo).
The schema lives in `src/schemas.ts` (`lab`).

Kinds:
- huggingface → `space: user/space-name` (Gradio, Streamlit or Docker SDK)
- gradio      → `url:` of any Gradio app
- streamlit   → `url:` of a Streamlit Cloud app (`?embed=true` is added)
- iframe      → `url:` of anything embeddable (e.g. a Render web app)
- api         → `url:` + `method:` + `sample:` JSON body (e.g. FastAPI on Render).
                The API must send CORS headers allowing https://winenpot.github.io
- native      → `component:` is a file name in src/components/demos/ (without
                .astro): `component: TSpanner` renders demos/TSpanner.astro.
                New files are picked up automatically; no registry to edit.
                Runs client-side, no "wake it up" step. See TSpanner.astro.
                `component: Blank` is an empty workbench slot (the template-*.md
                files use it; delete them once real demos exist).

Each demo is a small tile on /lab (LabTile.astro on ExpandTile/ExpandGrid); clicking it expands it over
the whole grid and opens the demo. `tone:` picks the tile colour
(lavender | periwinkle | violet | mauve | starlight | cobalt), `order:` the position.
The open demo's id is in the URL hash, so /lab/#t-spanner links straight to it.
