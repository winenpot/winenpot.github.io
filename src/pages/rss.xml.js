import rss from '@astrojs/rss';
import { SITE } from '../config/site';
import { getWriting } from '../lib/content';

export async function GET(context) {
  const posts = await getWriting();
  return rss({
    title: `${SITE.name} — writing`,
    description: SITE.description,
    site: context.site,
    items: posts.map((p) => ({ title: p.data.title, description: p.data.description, pubDate: p.data.date, link: `/writing/${p.id}/` })),
  });
}
