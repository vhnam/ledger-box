import { describe, expect, it } from 'vite-plus/test';

import { parseAcceptLanguage } from './accept-language.ts';

describe('parseAcceptLanguage', () => {
  it('returns the fallback for an empty or null header', () => {
    expect(parseAcceptLanguage(null)).toBe('en-US');
    expect(parseAcceptLanguage(undefined)).toBe('en-US');
    expect(parseAcceptLanguage('')).toBe('en-US');
  });

  it('matches an exact supported locale tag', () => {
    expect(parseAcceptLanguage('en-GB')).toBe('en-GB');
  });

  it('honors quality weights over header order', () => {
    expect(parseAcceptLanguage('fr;q=0.5,ja-JP;q=0.9')).toBe('ja-JP');
  });

  it('falls back to en-US for an unsupported region of a supported language (single-candidate ambiguity)', () => {
    expect(parseAcceptLanguage('en-AU')).toBe('en-US');
  });

  it('skips an ambiguous bare language match and continues to the next entry', () => {
    expect(parseAcceptLanguage('en;q=1,vi-VN;q=0.5')).toBe('vi-VN');
  });

  it('falls back to en-US when only an ambiguous bare language is present', () => {
    expect(parseAcceptLanguage('en')).toBe('en-US');
  });

  it('falls back to en-US for a fully unsupported locale', () => {
    expect(parseAcceptLanguage('ko-KR')).toBe('en-US');
  });

  it('matches Simplified and Traditional Chinese exactly', () => {
    expect(parseAcceptLanguage('zh-CN')).toBe('zh-CN');
    expect(parseAcceptLanguage('zh-TW')).toBe('zh-TW');
  });

  it('skips ambiguous bare zh when both zh-CN and zh-TW are supported', () => {
    expect(parseAcceptLanguage('zh;q=1,ja-JP;q=0.5')).toBe('ja-JP');
    expect(parseAcceptLanguage('zh')).toBe('en-US');
  });

  it('resolves an unambiguous bare language to its single supported region', () => {
    expect(parseAcceptLanguage('ja')).toBe('ja-JP');
  });

  it('does not throw on malformed entries', () => {
    expect(() => parseAcceptLanguage('*, ;q=, fr-FR;q=abc, ja-JP')).not.toThrow();
    expect(parseAcceptLanguage('*, ;q=, fr-FR;q=abc, ja-JP')).toBe('fr-FR');
  });
});
