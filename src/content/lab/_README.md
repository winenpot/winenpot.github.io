# Lab demos

One Markdown file per live demo. Files starting with `_` are ignored, so
copy one of the `_example-*.md` templates, drop the underscore, fill it in.
The schema lives in `src/content.config.ts` (collection `lab`).

Kinds:
- huggingface → `space: user/space-name` (Gradio, Streamlit or Docker SDK)
- gradio      → `url:` of any Gradio app
- streamlit   → `url:` of a Streamlit Cloud app (`?embed=true` is added)
- iframe      → `url:` of anything embeddable (e.g. a Render web app)
- api         → `url:` + `method:` + `sample:` JSON body (e.g. FastAPI on Render).
                The API must send CORS headers allowing https://winenpot.github.io
