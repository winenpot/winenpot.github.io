import { DEFAULT_LOCALE, type Locale } from './locales';

// Every user-facing UI string (not content) lives here, keyed. Content
// (posts, journal, work) carries its own `lang` field instead.
export const ui = {
  en: {
    'nav.writing': 'Writing',
    'nav.journal': 'Journal',
    'nav.work': 'Work',
    'nav.lab': 'Lab',
    'nav.about': 'About',
    'nav.home': 'Home',
    'hire.cta': 'Hire me',
    'hire.email': 'Write me an email',
    'hire.copy': 'Copy address',
    'hire.copied': 'Copied ✓',
    'hire.resume': 'View résumé',
    'hire.close': 'Close',
    'home.readWriting': 'Read the writing',
    'home.latest': 'Latest writing',
    'home.now': 'Now',
    'home.stats': 'By the numbers',
    'home.journal': 'From the journal',
    'home.lab': 'The lab',
    'home.work': 'A short history',
    'home.stack': 'Toolbox',
    'home.quote': 'Margin note',
    'stat.years': 'years in ML',
    'stat.roles': 'roles',
    'stat.posts': 'essays',
    'stat.demos': 'live demos',
    'lab.empty': 'The first experiments are on the workbench. Each one will run live right here — Hugging Face Spaces, Gradio, Streamlit and plain APIs.',
    'lab.wake': 'Wake it up',
    'lab.waking': 'Waking the server…',
    'lab.open': 'Open in new tab',
    'lab.send': 'Send request',
    'tspanner.hint': 'Click empty space to add a point · click a point to remove it',
    'tspanner.clear': 'Clear',
    'tspanner.mst': 'Show MST',
    'tspanner.random': 'random',
    'tspanner.points': 'points',
    'tspanner.edges': 'edges',
    'tspanner.length': 'length vs MST',
    'tspanner.build': 'build',
    'tspanner.computing': 'computing…',
    'tspanner.note': 'Sorts every pair by distance, then adds an edge only when the shortest path through the graph so far would exceed t × the direct distance. Push t toward 5 and toggle "show MST" — at large t, greedy construction becomes exactly Kruskal\u2019s minimum spanning tree.',
    'post.sample': 'Sample entry — a placeholder showing the format. Replace or delete it.',
    'post.minutes': 'min read',
    'post.back': 'All writing',
    'journal.back': 'Whole journal',
    'work.back': 'All work',
    'footer.built': 'Built with Astro · painted with Higgsfield · hosted on GitHub Pages',
    'photo.placeholder': 'Your photo goes here',
    'photo.hint': 'public/me.jpg → SITE.photo.src',
    'all.tags': 'All',
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type UIKey = keyof (typeof ui)[typeof DEFAULT_LOCALE];

export function t(key: UIKey, locale: Locale = DEFAULT_LOCALE): string {
  return (ui[locale] as Record<string, string>)[key] ?? ui[DEFAULT_LOCALE][key];
}
