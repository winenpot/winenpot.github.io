# Personal site plan: Ashkan Ranjbar (winenpot.github.io)

## Goal
A personal home on the web where Ashkan publishes long-form writing and short journal
entries, shows his work, and runs his own live demos (HF Spaces / Gradio / Streamlit /
Render APIs) right on the page. It borrows govacho.com's design DNA but has its own identity.

## Stack
- Astro (static output) + pnpm, with a per-project .npmrc (registry.npmjs.org) because the
  global mirror returns 402.
- Content collections: Markdown/MDX in src/content/{writing,journal,work}. Each file is
  type-checked frontmatter (title, date, tags, cover, draft).
- Shiki for code highlighting, KaTeX for math, plus RSS, sitemap and auto OG images.
- Vanilla JS "islands" only where needed (seg digits, photo reveal, demo embeds).
- Self-hosted WOFF2 fonts. No Google Fonts CDN, because it is slow or blocked from Iran.
- Deploy: GitHub Actions (withastro/action) -> GitHub Pages at https://winenpot.github.io.
  Repo winenpot/winenpot.github.io does not exist yet. gh is already authed as winenpot.
  Rename the local folder winenpot.githun.io -> winenpot.github.io.

## Design direction
- Reuse from govacho: the bento grid, concave-notch cards, LCD seven-segment numbers,
  B&W->color photo reveal on hover, keycap buttons, dashed inner frame, barcode strip,
  and the doodle figures.
- Make it his own with a "math notebook" layer: faint graph-paper background, hand-drawn
  Bayesian-network / graph doodles, a serif-ish display face plus a mono body.
- New palette, not govacho's 6 colors.
- One bold move per page. Everything else stays quiet.
- Quality floor: mobile-first at 375px, WCAG AA, prefers-reduced-motion, visible focus.

## Pages
/            Bento home:
             - Hero name card
             - PHOTO card (placeholder; swap public/me.jpg)
             - LCD stats (years in ML since 2020, posts, live demos)
             - Latest writing
             - Journal snippet
             - Playground (live status dots)
             - Work timeline
             - Stack
             - Contact (GitHub, Kaggle, LinkedIn, email)
             - Resume download
/writing     Blog index + post pages (tags, reading time, math, code)
/journal     Short dated entries, notebook-style cards
/work        Case studies taken from the resume:
             - Bayesian-net bot orchestration (>95% fewer LLM calls)
             - GRPO fine-tuning and the retrieval memory system
             - Markepto trading app (500+ strategies, backtesting pipeline)
             - MRO software + RAG assistant (team lead)
             - Explicit-image classifier (~98%)
             - Crime model (84% F1)
             - Mall electricity forecasting (26% MAPE)
/lab         Live demos:
             - <DemoCard> per demo: HF Space (gradio web component),
               Streamlit (?embed=true iframe) or Render API (small fetch form).
             - Demos load on click ("wake" button + LCD timer), because free
               tiers sleep and take 30-60s to cold-start.
             - Render APIs need CORS allowed for winenpot.github.io.
/about       Longer story, a second photo placeholder, education (Applied Math, AUT),
             certificates, the book translation, "now" section
/resume      HTML resume + PDF download

## Phases
0. Answer the open questions, scaffold Astro, git init, create the repo.
1. Design system (tokens, type, notch card, seg.js, photo reveal), then a home mock at
   375px and 1440px for review.
2. Content model + pages, seeded from the resume. Sample post and journal entry are
   labeled as samples.
3. Lab: the DemoCard component + 1-2 real demos.
4. Polish: OG images, RSS, a11y and Lighthouse pass, motion checks scrubbed frame by frame.
5. Deploy via Actions and verify the live URL on mobile and desktop.

## Publishing workflow (after launch)
1. Write src/content/writing/my-post.md (or journal/).
2. git push.
3. The site is live in about a minute.
Optional: point this at an Obsidian folder later.

## Docs & notes
Project notes, plans and parked work live in `docs/`. That folder is also this
project's Obsidian vault ("Open folder as vault" → `docs/`). Start at
`docs/README.md`.

## Parked (future TODO)
- Wittgenstein figure: swap the footer mathematician for Wittgenstein (grey
  trousers) and draw marks in his notebook. Blocked on image tooling (Higgsfield
  behind a Cloudflare geo-block; the HF Space hits the free GPU cap). Details,
  inputs and options: `docs/parked/Wittgenstein figure.md`. Inputs and scripts:
  `assets/gen/wittgenstein/`.
- Khayyam look-up pose: the footer is getting a single-pose Khayyam (redesign
  plan §2b). A matching look-up pose for the cross-fade needs the same image
  tooling.
