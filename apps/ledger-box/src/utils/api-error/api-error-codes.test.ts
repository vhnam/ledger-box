import { describe, expect, it } from 'vite-plus/test';

import { apiErrorCatalogId, isApiErrorCode } from './api-error-codes';

describe('isApiErrorCode', () => {
  it('accepts known error codes', () => {
    expect(isApiErrorCode('WALLET_NOT_FOUND')).toBe(true);
  });

  it('rejects unknown strings and non-strings', () => {
    expect(isApiErrorCode('NOT_A_REAL_CODE')).toBe(false);
    expect(isApiErrorCode(undefined)).toBe(false);
    expect(isApiErrorCode(42)).toBe(false);
  });
});

describe('apiErrorCatalogId', () => {
  it('prefixes the code with "errors."', () => {
    expect(apiErrorCatalogId('WALLET_NOT_FOUND')).toBe('errors.WALLET_NOT_FOUND');
  });
});
