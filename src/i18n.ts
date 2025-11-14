// Simple i18n config for Pages Router
// For now, we use English as default
export const locales = ['en', 'pl'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

