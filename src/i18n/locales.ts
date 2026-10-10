// Languages the site is built in. English only for now; the plumbing is
// here so adding one is mechanical (see AGENTS.md -> "Adding a language").
export const LOCALES = {
  en: { label: 'English', dir: 'ltr', htmlLang: 'en' },
  // fa: { label: 'فارسی', dir: 'rtl', htmlLang: 'fa' },
} as const;

export type Locale = keyof typeof LOCALES;
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_CODES = Object.keys(LOCALES) as Locale[];
