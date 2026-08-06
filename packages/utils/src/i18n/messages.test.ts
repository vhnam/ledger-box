import { describe, expect, it } from 'vite-plus/test';

import enGB from './messages/en-GB.json';
import enUS from './messages/en-US.json';
import frFR from './messages/fr-FR.json';
import jaJP from './messages/ja-JP.json';
import viVN from './messages/vi-VN.json';
import zhCN from './messages/zh-CN.json';
import zhTW from './messages/zh-TW.json';

describe('message catalog key parity', () => {
  const englishKeys = Object.keys(enUS).sort();
  const catalogs = [
    ['en-GB', enGB],
    ['vi-VN', viVN],
    ['ja-JP', jaJP],
    ['fr-FR', frFR],
    ['zh-CN', zhCN],
    ['zh-TW', zhTW],
  ] as const;

  it.each(catalogs)('every key in %s.json exists in en-US.json', (_language, catalog) => {
    for (const key of Object.keys(catalog)) {
      expect(englishKeys.includes(key)).toBe(true);
    }
  });

  it.each(catalogs)('every key in en-US.json exists in %s.json', (_language, catalog) => {
    const catalogKeys = new Set(Object.keys(catalog));

    for (const key of englishKeys) {
      expect(catalogKeys.has(key)).toBe(true);
    }
  });

  it('uses British spelling in en-GB for known US/UK divergences', () => {
    expect(enUS['settings.appearance.description']).toContain('color');
    expect(enGB['settings.appearance.description']).toContain('colour');
    expect(enUS['errors.UNAUTHORIZED']).toBe('Unauthorized');
    expect(enGB['errors.UNAUTHORIZED']).toBe('Unauthorised');
  });

  it('uses Simplified vs Traditional Chinese for the same keys', () => {
    expect(zhCN['settings.dialog.title']).toBe('设置');
    expect(zhTW['settings.dialog.title']).toBe('設置');
  });
});
