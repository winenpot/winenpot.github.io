/**
 * The shape of every content file in src/content/. Pure Zod, no Astro
 * imports, so two things can share it:
 *  - src/content.config.ts wires each schema to its folder (the build
 *    rejects any file that doesn't match)
 *  - scripts/check-cms.ts checks the /admin CMS form (public/admin/config.yml)
 *    still has every field the schema requires
 * Add a field here → add it to public/admin/config.yml too.
 */
import { z } from 'astro/zod';

const lang = z.string().default('en');
export const tone = z.enum(['lavender', 'periwinkle', 'violet', 'mauve', 'starlight', 'cobalt']);
const yearMonth = z.string().regex(/^\d{4}-\d{2}$/);
/** A year written as 2017 or "2017" (YAML reads bare years as numbers). Required. */
const year = z.union([z.string(), z.number()]).transform(String);
const items = <T extends z.ZodType>(item: T) => z.object({ items: z.array(item).default([]) });

/** Long-form essays → /writing/<slug>/ */
export const writing = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  /** true = placeholder content; shows a "sample" banner. */
  sample: z.boolean().default(false),
  lang,
});

/** Short dated notes → /journal/<slug>/ */
export const journal = z.object({
  title: z.string(),
  date: z.coerce.date(),
  mood: z.string().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  sample: z.boolean().default(false),
  lang,
});

/** Case studies → /work (tiles + timeline), home, résumé. */
export const work = z.object({
  title: z.string(),
  org: z.string(),
  role: z.string(),
  /** "2025-02" style; drives timeline order and position. */
  start: yearMonth,
  end: yearMonth.optional(),
  summary: z.string(),
  metrics: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
  tags: z.array(z.string()).default([]),
  /** wider tile on /work */
  featured: z.boolean().default(false),
  /** card colour on /work; default cycles through the palette */
  tone: tone.optional(),
  draft: z.boolean().default(false),
  lang,
});

/**
 * Live demos → /lab. One file per demo. `kind` selects the embed:
 *  - huggingface : `space: "user/name"` (any SDK: gradio, streamlit, docker)
 *  - gradio      : `url` of a Gradio app
 *  - streamlit   : `url` of a Streamlit app (?embed=true is added)
 *  - iframe      : any embeddable `url` (Render web app, etc.)
 *  - api         : JSON API (e.g. FastAPI on Render) — `url`, `method`, `sample`
 *  - native      : runs in the browser — `component` is a file name in
 *                  src/components/demos/ (`Blank` = empty template slot)
 * Templates: src/content/_templates/lab/.
 */
export const lab = z.object({
  title: z.string(),
  description: z.string(),
  kind: z.enum(['huggingface', 'gradio', 'streamlit', 'iframe', 'api', 'native']),
  space: z.string().optional(),
  url: z.url().optional(),
  method: z.enum(['GET', 'POST']).default('POST'),
  sample: z.string().optional(),
  /** api: a route id in proxy/routes.json, called through PUBLIC_DEMO_PROXY_URL
   *  instead of `url` (for APIs that need a secret key) */
  proxy: z.string().regex(/^[a-z0-9-]+$/).optional(),
  /** api: form fields; their values are sent as one flat JSON object.
   *  Without inputs the visitor edits raw JSON (`sample`). */
  inputs: z.array(z.object({
    name: z.string().regex(/^\w+$/),
    label: z.string(),
    type: z.enum(['text', 'textarea', 'number', 'select']).default('text'),
    default: z.union([z.string(), z.number()]).optional(),
    options: z.array(z.string()).optional(),
  })).default([]),
  /** api: how to show the reply. text shows `result` if the proxy picked one. */
  output: z.enum(['json', 'text', 'image']).default('json'),
  height: z.number().default(620),
  repo: z.url().optional(),
  component: z.string().optional(),
  /** Card tone of the tile on /lab (see Card.astro). */
  tone: tone.default('violet'),
  tags: z.array(z.string()).default([]),
  order: z.number().default(0),
  draft: z.boolean().default(false),
  lang,
});

/** Footer quotes, one JSON file each → src/content/quotes/ (see its README). */
export const quotes = z.object({
  text: z.string().min(1),
  author: z.string().min(1),
  source: z.string().optional(),
});

/* ── profile: lists you grow over time, one file each in src/content/profile/ ── */

/** Home page "Now" card. */
export const now = items(z.string());

/** Degrees; `courses` feeds /about's grade list and the résumé. */
export const education = items(z.object({
  degree: z.string(),
  school: z.string(),
  start: year,
  end: year.optional(),
  courses: z.array(z.object({ name: z.string(), grade: z.string() })).default([]),
}));

export const certificates = items(z.object({ name: z.string(), issuer: z.string().optional(), note: z.string().optional() }));

/** Books, translations, papers: the résumé's "Publications" section. */
export const publications = items(z.object({ title: z.string(), kind: z.string(), note: z.string().optional(), url: z.url().optional() }));

/** `summary`: the short stack on /about. `full`: the résumé's tool list. */
const skillGroup = z.object({ group: z.string(), items: z.array(z.string()) });
export const skills = z.object({ summary: z.array(skillGroup).default([]), full: z.array(skillGroup).default([]) });

/** /about's "loves" chips. */
export const interests = items(z.string());

/** /about's page copy: frontmatter for the small bits, the body is "the short version". */
export const about = z.object({ lede: z.string(), values: z.string().optional(), closing: z.string() });

/** Every collection, by name: the folder layout lives in content.config.ts. */
export const schemas = {
  writing, journal, work, lab, quotes,
  now, education, certificates, publications, skills, interests, about,
};
