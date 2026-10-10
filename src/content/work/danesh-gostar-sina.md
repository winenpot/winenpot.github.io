---
title: Agents that think only when they must
org: Danesh Gostar Sina
role: Research Scientist & Developer
start: "2025-02"
end: "2026-03"
summary: Replaced a fully agentic social-bot loop with a Bayesian network and rule-based random walks, cutting LLM API calls by more than 95% while making the bots read as more human.
metrics:
  - { value: ">95%", label: fewer LLM API calls }
  - { value: "<5%", label: of actions need a model }
  - { value: GRPO, label: fine-tuned for authenticity }
tags: [Bayesian networks, LLM agents, GRPO, RAG, memory]
featured: true
---

## The problem

A fleet of social agents was calling a large language model for *every* decision — whether to like, follow, reply or scroll on. It was slow, expensive and, ironically, not very human.

## What I built

- **A Bayesian network for behaviour.** Most actions (likes, follows, browsing) became samples from a probabilistic model of how real people behave, walked with rule-based random walks. The LLM was reserved for what only it can do: writing text, reading images and replying.
- **GRPO fine-tuning.** Open-source models were fine-tuned with Group Relative Policy Optimization to sound more authentic and less spam-like.
- **Cheap long-term memory.** A low-cost retrieval memory kept each agent's replies relevant to its own history.

## Result

LLM API calls dropped from "everything" to under 5% of actions — a reduction of more than 95% — and the agents became more believable, not less.
