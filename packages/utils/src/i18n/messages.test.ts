import { describe, expect, it } from 'vite-plus/test';

import en from './messages/en.json';
import fr from './messages/fr.json';
import ja from './messages/ja.json';
import vi from './messages/vi.json';

describe('message catalog key parity', () => {
  const englishKeys = new Set(Object.keys(en));

  it.each([
    ['vi', vi],
    ['ja', ja],
    ['fr', fr],
  ])('every key in %s.json exists in en.json', (_language, catalog) => {
    for (const key of Object.keys(catalog)) {
      expect(englishKeys.has(key)).toBe(true);
    }
  });
});
