import { parseAcceptLanguage } from '@vhnam/utils/locale';

/**
 * Resolves a display locale from the viewer's own browser, for routes with no
 * authenticated user (the public `/statement/$token` page). Reuses `parseAcceptLanguage`'s
 * exact matching semantics by synthesizing a header-like string from
 * `navigator.languages`, so client-side, signup-time, and public-statement-CSV resolution
 * never drift apart.
 */
export function resolveClientLocale(): string {
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];

  return parseAcceptLanguage(candidates.join(','));
}
