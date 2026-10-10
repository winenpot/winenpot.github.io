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
export function hfSpaceUrl(space: string) {
  const [user, name] = space.split('/');
  const slug = (s: string) => s.toLowerCase().replace(/[._]/g, '-');
  return `https://${slug(user)}-${slug(name)}.hf.space`;
}

export type Writing = CollectionEntry<'writing'>;
export type Work = CollectionEntry<'work'>;
