import { describe, expect, it } from 'vite-plus/test';

import { getAvatarFallbackFromEmail, getAvatarFallbackFromName } from './avatar';

describe('getAvatarFallbackFromName', () => {
  it('joins the first letter of each word, uppercased', () => {
    expect(getAvatarFallbackFromName('Nam Vo')).toBe('NV');
    expect(getAvatarFallbackFromName('  cher  ')).toBe('C');
  });

  it('returns N/A for empty or whitespace-only names', () => {
    expect(getAvatarFallbackFromName('')).toBe('N/A');
    expect(getAvatarFallbackFromName('   ')).toBe('N/A');
  });
});

describe('getAvatarFallbackFromEmail', () => {
  it('returns the uppercased first character', () => {
    expect(getAvatarFallbackFromEmail('nam@example.com')).toBe('N');
  });

  it('returns N/A for an empty email', () => {
    expect(getAvatarFallbackFromEmail('   ')).toBe('N/A');
  });
});
