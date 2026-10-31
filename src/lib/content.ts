import { getCollection, type CollectionEntry } from 'astro:content';

const live = <T extends { data: { draft?: boolean } }>(e: T) =>
  import.meta.env.PROD ? !e.data.draft : true;

export async function getWriting() {
  return (await getCollection('writing', live)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
}
export async function getJournal() {
  return (await getCollection('journal', live)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
}
export async function getWork() {
  return (await getCollection('work', live)).sort((a, b) => b.data.start.localeCompare(a.data.start));
}
export async function getLab() {
  return (await getCollection('lab', live)).sort((a, b) => a.data.order - b.data.order);
}
/** One profile list from src/content/profile/<name>.yaml (or about.md). */
type ProfileName = 'now' | 'education' | 'certificates' | 'publications' | 'skills' | 'interests' | 'about';
export async function getProfile<N extends ProfileName>(name: N): Promise<CollectionEntry<N>> {
  const [entry] = await getCollection(name);
  if (!entry) throw new Error(`Missing src/content/profile/${name === 'about' ? 'about.md' : `${name}.yaml`}`);
  return entry as CollectionEntry<N>;
}

/** "Applied Data Science I & II (with honors) — WorldQuant University" */
export function certLine(c: { name: string; issuer?: string; note?: string }) {
  return [c.name + (c.note ? ` (${c.note})` : ''), c.issuer].filter(Boolean).join(' — ');
}

/** An empty template slot on /lab (`component: Blank`), not a real demo. */
export const isTemplate = (d: CollectionEntry<'lab'>) => d.data.kind === 'native' && d.data.component === 'Blank';

/** Tags across items, most used first; keeps those used at least `min` times, at most `max`. */
export function topTags(lists: string[][], { min = 1, max = Infinity } = {}) {
  const n = new Map<string, number>();
  for (const t of lists.flat()) n.set(t, (n.get(t) ?? 0) + 1);
  return [...n].filter(([, c]) => c >= min).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, max).map(([t]) => t);
}

const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
/** countWord(6, 'role') → "Six roles"; past twelve it uses digits. */
export function countWord(n: number, noun: string) {
  return `${WORDS[n] ?? n} ${noun}${n === 1 ? '' : 's'}`;
}

export function readingTime(body = '') {
  const words = body.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function fmtDate(d: Date, opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }) {
  return d.toLocaleDateString('en-GB', opts);
}

export function fmtMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** Hugging Face Space "user/name" → embeddable https://user-name.hf.space */
/** The demo's own page, for the "open in new tab" link (native demos have none). */
export function labPageUrl(d: { kind: string; space?: string; url?: string }) {
  if (d.kind === 'huggingface' && d.space) return `https://huggingface.co/spaces/${d.space}`;
  return d.kind === 'native' ? undefined : d.url;
}

export function hfSpaceUrl(space: string) {
  const [user, name] = space.split('/');
  const slug = (s: string) => s.toLowerCase().replace(/[._]/g, '-');
  return `https://${slug(user)}-${slug(name)}.hf.space`;
}

export type Writing = CollectionEntry<'writing'>;
export type Work = CollectionEntry<'work'>;
