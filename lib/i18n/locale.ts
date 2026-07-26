/**
 * Supported locales for the app i18n scaffolding (issue #277).
 *
 * `pt-BR` is the default: business-rules.md documents Portuguese as the
 * yard operators' language, and every page not yet migrated to `t()` still
 * renders hardcoded Portuguese strings — so an undetected/unknown locale
 * must resolve to `pt-BR`, never `en`.
 */
export const locales = ["pt-BR", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pt-BR";

export function isLocale(value: string | undefined | null): value is Locale {
  return locales.includes(value as Locale);
}
