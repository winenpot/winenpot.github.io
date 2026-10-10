// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { SITE } from './src/config/site.ts';
import { DEFAULT_LOCALE, LOCALE_CODES } from './src/i18n/locales.ts';

// https://astro.build — static output, deployed to GitHub Pages by
// .github/workflows/deploy.yml. A <user>.github.io repo serves from the
// domain root, so no `base` is needed.
export default defineConfig({
  site: SITE.url,
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: { theme: 'tokyo-night', wrap: true },
  },
  // English only for now. To add a language: see AGENTS.md -> "Adding a language".
  i18n: {
    defaultLocale: DEFAULT_LOCALE,
    locales: LOCALE_CODES,
    routing: { prefixDefaultLocale: false },
  },
});
