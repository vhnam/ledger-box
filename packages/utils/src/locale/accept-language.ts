import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './constants.ts';

const MAX_HEADER_LENGTH = 200;
const MAX_ENTRIES = 20;

type ParsedEntry = {
  tag: string;
  quality: number;
};

function parseEntry(rawEntry: string): ParsedEntry | null {
  const [rawTag, ...paramParts] = rawEntry.trim().split(';');
  const tag = rawTag?.trim();

  if (!tag || tag === '*') {
    return null;
  }

  const qualityParam = paramParts.map((part) => part.trim()).find((part) => part.toLowerCase().startsWith('q='));

  if (!qualityParam) {
    return { tag, quality: 1 };
  }

  const quality = Number.parseFloat(qualityParam.slice(2));

  if (!Number.isFinite(quality)) {
    return { tag, quality: 1 };
  }

  return { tag, quality };
}

function baseLanguage(tag: string): string {
  return (tag.split('-')[0] ?? tag).toLowerCase();
}

function findExactMatch(tag: string, supported: readonly string[]): string | undefined {
  const normalized = tag.toLowerCase();

  return supported.find((candidate) => candidate.toLowerCase() === normalized);
}

function findUnambiguousLanguageMatch(tag: string, supported: readonly string[]): string | undefined {
  const language = baseLanguage(tag);
  const candidates = supported.filter((candidate) => baseLanguage(candidate) === language);

  return candidates.length === 1 ? candidates[0] : undefined;
}

/**
 * Resolves a raw `Accept-Language` header to one of `supported`'s locale tags, or `fallback`.
 * Pure and synchronous — safe to call from any server context (better-auth signup hook,
 * public statement Netlify Function).
 */
export function parseAcceptLanguage(
  headerValue: string | null | undefined,
  supported: readonly string[] = SUPPORTED_LOCALES,
  fallback: string = DEFAULT_LOCALE,
): string {
  if (!headerValue) {
    return fallback;
  }

  const truncatedHeader = headerValue.slice(0, MAX_HEADER_LENGTH);
  const entries = truncatedHeader
    .split(',')
    .slice(0, MAX_ENTRIES)
    .map(parseEntry)
    .filter((entry): entry is ParsedEntry => entry !== null);

  const sortedEntries = entries
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => right.entry.quality - left.entry.quality || left.index - right.index)
    .map(({ entry }) => entry);

  for (const { tag } of sortedEntries) {
    const exactMatch = findExactMatch(tag, supported);

    if (exactMatch) {
      return exactMatch;
    }

    const languageMatch = findUnambiguousLanguageMatch(tag, supported);

    if (languageMatch) {
      return languageMatch;
    }
  }

  return fallback;
}
