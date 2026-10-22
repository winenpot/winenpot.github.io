import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Files whose name starts with "_" are ignored (use them as templates).
const pattern = '**/[^_]*.{md,mdx}';

const lang = z.string().default('en');

/** Long-form essays → /writing/<slug>/ */
const writing = defineCollection({
  loader: glob({ pattern, base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    /** true = placeholder content; shows a "sample" banner. */
    sample: z.boolean().default(false),
    lang,
  }),
});

/** Short dated notes → /journal/<slug>/ */
const journal = defineCollection({
  loader: glob({ pattern, base: './src/content/journal' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    mood: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    sample: z.boolean().default(false),
    lang,
  }),
});

/** Case studies → /work/<slug>/ ; also feeds the home timeline + stats. */
const work = defineCollection({
  loader: glob({ pattern, base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    org: z.string(),
    role: z.string(),
    /** "2025-02" style; drives timeline order and position. */
    start: z.string().regex(/^\d{4}-\d{2}$/),
    end: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    summary: z.string(),
    metrics: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    lang,
  }),
});

/**
 * Live demos → /lab/. One file per demo. `kind` selects the embed:
 *  - huggingface : `space: "user/name"` (any SDK: gradio, streamlit, docker)
 *  - gradio      : `url` of a Gradio app
 *  - streamlit   : `url` of a Streamlit app (?embed=true is added)
 *  - iframe      : any embeddable `url` (Render web app, etc.)
 *  - api         : JSON API (e.g. FastAPI on Render) — `url`, `method`, `sample`
 *  - native      : runs entirely client-side, no server to wake —
 *                  `component` names a file in src/components/demos/
 *                  (mapped in src/pages/lab/index.astro's NATIVE registry)
 * See src/content/lab/_example-*.md for templates.
 */
const lab = defineCollection({
  loader: glob({ pattern, base: './src/content/lab' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    kind: z.enum(['huggingface', 'gradio', 'streamlit', 'iframe', 'api', 'native']),
    space: z.string().optional(),
    url: z.string().url().optional(),
    method: z.enum(['GET', 'POST']).default('POST'),
    sample: z.string().optional(),
    height: z.number().default(620),
    repo: z.string().url().optional(),
    component: z.string().optional(),
    tags: z.array(z.string()).default([]),
    order: z.number().default(0),
    draft: z.boolean().default(false),
    lang,
  }),
});

export const collections = { writing, journal, work, lab };
