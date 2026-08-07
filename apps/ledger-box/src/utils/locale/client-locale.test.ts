import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { resolveClientLocale } from './client-locale';

describe('resolveClientLocale', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves from navigator.languages when present', () => {
    vi.stubGlobal('navigator', { languages: ['fr-FR', 'en-US'], language: 'en-US' });

    expect(resolveClientLocale()).toBe('fr-FR');
  });

  it('falls back to navigator.language when languages is empty', () => {
    vi.stubGlobal('navigator', { languages: [], language: 'vi-VN' });

    expect(resolveClientLocale()).toBe('vi-VN');
  });
});
