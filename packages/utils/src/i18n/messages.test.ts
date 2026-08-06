import { describe, expect, it } from 'vite-plus/test';

import en from './messages/en.json';
import fr from './messages/fr.json';
import ja from './messages/ja.json';
import vi from './messages/vi.json';

describe('message catalog key parity', () => {
  const englishKeys = Object.keys(en).sort();
  const catalogs = [
    ['vi', vi],
    ['ja', ja],
    ['fr', fr],
  ] as const;

  it.each(catalogs)('every key in %s.json exists in en.json', (_language, catalog) => {
    for (const key of Object.keys(catalog)) {
      expect(englishKeys.includes(key)).toBe(true);
    }
  });

  it.each(catalogs)('every key in en.json exists in %s.json', (_language, catalog) => {
    const catalogKeys = new Set(Object.keys(catalog));

    for (const key of englishKeys) {
      expect(catalogKeys.has(key)).toBe(true);
    }
  });
});
