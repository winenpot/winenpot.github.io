// ─────────────────────────────────────────────────────────────────────
//  SITE KNOBS — the one file to edit for identity, links, photo, hire-me
//  copy and the "now" list. Components read from here; never hard-code
//  these values elsewhere. See AGENTS.md for the full knob map.
// ─────────────────────────────────────────────────────────────────────

export const SITE = {
  url: 'https://winenpot.github.io',
  name: 'Vincent Law',
  firstName: 'Ashkan',
  lastName: 'Ranjbar',
  handle: 'winenpot',
  role: 'Applied mathematician · ML engineer',
  tagline:
    'I translate messy business problems into data-driven systems — using math, with love.',
  intro:
    'Applied-math graduate turned machine-learning engineer. I build LLM systems that think only when they must, pipelines that stay quiet at 3 a.m., and the occasional strange experiment with geometry and probability.',
  description:
    'Writing, journal, work and live experiments of Ashkan — machine learning, mathematics, philosophy and geometry.',
  location: 'Tehran, Iran',
  email: 'ashkanmehravand@gmail.com',
  /** First year of professional ML work — drives the "years" LCD stat. */
  sinceYear: 2020,

  /**
   * Your portrait. Leave `src` empty to show the painted-arch placeholder.
   * To switch: drop a photo at public/me.jpg (portrait, ~1200px tall) and
   * set src: '/me.jpg'. It is shown in greyscale and revealed in color
   * under the cursor.
   */
  photo: { src: '', alt: 'Portrait of Ashkan' },
  /** Second photo slot used on /about (same rules). */
  aboutPhoto: { src: '', alt: 'Ashkan, at work' },

  hire: {
    headline: 'Have a problem worth modeling?',
    blurb:
      'I help teams turn data and language models into dependable products — from a first prototype to something that survives production.',
    availability: 'Open to freelance, contract and full-time roles · remote-friendly',
    offers: [
      'LLM & agent systems that cost less to run',
      'Fine-tuning (GRPO, LoRA) & retrieval memory',
      'MLOps: CI/CD, serving, monitoring',
      'Forecasting & classical ML',
      'FastAPI / React product engineering',
      'Technical leadership & mentoring',
    ],
    emailSubject: 'Hello Vincent — a project idea',
  },

  /** Contact links. Remove an entry to hide it everywhere. */
  links: [
    { label: 'GitHub', href: 'https://github.com/winenpot', icon: 'github' },
    { label: 'Kaggle', href: 'https://www.kaggle.com/ashkanranjbar', icon: 'kaggle' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/ashkanranjbar', icon: 'linkedin' },
    { label: 'Email', href: 'mailto:ashkanmehravand@gmail.com', icon: 'mail' },
    { label: 'RSS', href: '/rss.xml', icon: 'rss' },
  ],

  /** "Now" card on the home page — what you are up to lately. */
  now: [
    'Building a calm study system: Anki + Notion + small local LLMs',
    'Learning Rust, one borrow-checker argument at a time',
    'Reading on cognitive science and the geometry of thought',
  ],

  stack: {
    Languages: ['Python', 'Rust', 'TypeScript'],
    'ML & LLMs': ['PyTorch', 'transformers', 'scikit-learn', 'LangChain', 'Ray', 'ONNX', 'MLflow'],
    Systems: ['FastAPI', 'Django', 'React', 'Docker', 'Kubernetes', 'Prefect', 'Celery'],
    Data: ['PostgreSQL', 'Redis', 'Elasticsearch', 'Neo4j', 'Qdrant', 'Polars', 'Superset'],
  },
} as const;

/** Top navigation. `key` is an i18n key in src/i18n/ui.ts. */
export const NAV = [
  { key: 'nav.writing', href: '/writing/' },
  { key: 'nav.journal', href: '/journal/' },
  { key: 'nav.work', href: '/work/' },
  { key: 'nav.lab', href: '/lab/' },
  { key: 'nav.about', href: '/about/' },
] as const;
