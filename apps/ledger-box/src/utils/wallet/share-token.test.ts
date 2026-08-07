import { describe, expect, it } from 'vite-plus/test';

import { generateShareToken, hashShareToken, verifyTokenConstantTime } from './share-token';

describe('generateShareToken', () => {
  it('produces a base64url raw token whose hash matches hashShareToken', async () => {
    const { raw, hash } = await generateShareToken();

    expect(raw).not.toMatch(/[+/=]/);
    expect(await hashShareToken(raw)).toBe(hash);
  });

  it('generates distinct tokens on each call', async () => {
    const first = await generateShareToken();
    const second = await generateShareToken();

    expect(first.raw).not.toBe(second.raw);
    expect(first.hash).not.toBe(second.hash);
  });
});

describe('verifyTokenConstantTime', () => {
  it('returns true for equal strings and false otherwise', () => {
    expect(verifyTokenConstantTime('abc123', 'abc123')).toBe(true);
    expect(verifyTokenConstantTime('abc123', 'abc124')).toBe(false);
  });

  it('returns false for different-length strings without throwing', () => {
    expect(verifyTokenConstantTime('short', 'a-lot-longer')).toBe(false);
  });
});
