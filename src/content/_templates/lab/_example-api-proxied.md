---
# An API that needs a secret key (e.g. an LLM). The key lives in the demo
# proxy (proxy/, a Cloudflare Worker), never in this file or the page.
# 1. Add a route to proxy/routes.json (copy "ask-claude"), set "enabled": true,
#    store the key: `pnpm --dir proxy exec wrangler secret put ANTHROPIC_API_KEY`,
#    deploy: `pnpm --dir proxy run deploy`.
# 2. Set the PUBLIC_DEMO_PROXY_URL repo variable (see .env.example).
# 3. Copy this file into src/content/lab/ without the underscore.
title: Ask Claude
description: A small question box. The key stays on the server; answers are capped and rate-limited.
kind: api
proxy: ask-claude
output: text
inputs:
  - { name: prompt, label: Your question, type: textarea, default: "Explain a t-spanner in two sentences." }
tags: [llm, claude]
order: 4
---
