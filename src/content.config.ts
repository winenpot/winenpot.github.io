/**
 * Which folder (or file) in src/content/ feeds which collection. The field
 * definitions live in src/schemas.ts (shared with the CMS drift check).
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import * as s from './schemas';

// Files whose name starts with "_" are ignored (use them as templates).
const pattern = '**/[^_]*.{md,mdx}';
const folder = (name: string) => glob({ pattern, base: `./src/content/${name}` });

// profile: each collection holds exactly one file in src/content/profile/;
// read them with getProfile('<name>') from src/lib/content.ts.
const profileFile = (file: string) => glob({ pattern: file, base: './src/content/profile' });

export const collections = {
  writing: defineCollection({ loader: folder('writing'), schema: s.writing }),
  journal: defineCollection({ loader: folder('journal'), schema: s.journal }),
  work: defineCollection({ loader: folder('work'), schema: s.work }),
  lab: defineCollection({ loader: folder('lab'), schema: s.lab }),
  quotes: defineCollection({ loader: glob({ pattern: '[^_]*.json', base: './src/content/quotes' }), schema: s.quotes }),

  now: defineCollection({ loader: profileFile('now.yaml'), schema: s.now }),
  education: defineCollection({ loader: profileFile('education.yaml'), schema: s.education }),
  certificates: defineCollection({ loader: profileFile('certificates.yaml'), schema: s.certificates }),
  publications: defineCollection({ loader: profileFile('publications.yaml'), schema: s.publications }),
  skills: defineCollection({ loader: profileFile('skills.yaml'), schema: s.skills }),
  interests: defineCollection({ loader: profileFile('interests.yaml'), schema: s.interests }),
  about: defineCollection({ loader: profileFile('about.md'), schema: s.about }),
};
