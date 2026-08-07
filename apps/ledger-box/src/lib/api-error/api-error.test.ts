import axios from 'axios';
import { describe, expect, it } from 'vite-plus/test';

import { getApiError, getApiErrorMessage } from './api-error.ts';

describe('getApiError', () => {
  it('maps JSON { code, message } bodies to errors.{CODE} catalog ids', () => {
    const error = new axios.AxiosError('Request failed');
    error.response = {
      data: {
        code: 'TRANSFER_CURRENCY_MISMATCH',
        message: 'Cannot transfer between wallets with different currencies',
      },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {} as never,
    };

    expect(getApiError(error, 'transfer.errorFallback')).toEqual({
      code: 'TRANSFER_CURRENCY_MISMATCH',
      message: 'errors.TRANSFER_CURRENCY_MISMATCH',
    });
    expect(getApiErrorMessage(error, 'transfer.errorFallback')).toBe('errors.TRANSFER_CURRENCY_MISMATCH');
  });

  it('passes through plain-text bodies for transitional clients', () => {
    const error = new axios.AxiosError('Request failed');
    error.response = {
      data: 'Wallet not found',
      status: 404,
      statusText: 'Not Found',
      headers: {},
      config: {} as never,
    };

    expect(getApiErrorMessage(error, 'errors.WALLET_NOT_FOUND')).toBe('Wallet not found');
  });

  it('uses the fallback when no response body is present', () => {
    expect(getApiErrorMessage(new Error(''), 'transfer.errorFallback')).toBe('transfer.errorFallback');
  });
});
