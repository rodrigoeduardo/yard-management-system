import { cookies, headers } from "next/headers";
import { defaultLocale, isLocale, type Locale } from "./locale";

/** Cookie a locale switcher (future work) would write to override detection. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * Server-side locale detection for the current request, in priority order:
 * 1. the `NEXT_LOCALE` cookie (an explicit user choice, once a switcher UI
 *    exists — none is in scope for #277);
 * 2. the `Accept-Language` header's first tag, matched by primary subtag
 *    (`en-US` → `en`);
 * 3. `defaultLocale` (`pt-BR`) — the safe fallback for undetected/unknown
 *    locales, matching current UI text everywhere not yet migrated.
 */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) {
    return cookieLocale;
  }

  const headerList = await headers();
  const acceptLanguage = headerList.get("accept-language");
  const preferredTag = acceptLanguage?.split(",")[0]?.trim().toLowerCase();
  if (preferredTag?.startsWith("en")) {
    return "en";
  }

  return defaultLocale;
}
