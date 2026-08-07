import type { IntlShape } from 'react-intl';
import { describe, expect, it, vi } from 'vite-plus/test';

import { formatErrorMessage } from './intl-message';

function createIntl(messages: Record<string, string>): IntlShape {
  return {
    messages,
    formatMessage: vi.fn(({ id }: { id: string }, values?: Record<string, unknown>) =>
      values ? `${id}:${JSON.stringify(values)}` : id,
    ),
  } as unknown as IntlShape;
}

describe('formatErrorMessage', () => {
  it('formats known catalog ids through the intl instance', () => {
    const intl = createIntl({ 'errors.WALLET_NOT_FOUND': 'Wallet not found' });

    expect(formatErrorMessage(intl, 'errors.WALLET_NOT_FOUND')).toBe('errors.WALLET_NOT_FOUND');
    expect(intl.formatMessage).toHaveBeenCalledOnce();
  });

  it('passes values through to formatMessage for known ids', () => {
    const intl = createIntl({ 'transfer.errorFallback': 'Something went wrong' });

    expect(formatErrorMessage(intl, 'transfer.errorFallback', { amount: 5 })).toBe(
      'transfer.errorFallback:{"amount":5}',
    );
  });

  it('returns unrecognized text unchanged without calling formatMessage', () => {
    const intl = createIntl({});

    expect(formatErrorMessage(intl, 'Wallet not found')).toBe('Wallet not found');
    expect(intl.formatMessage).not.toHaveBeenCalled();
  });
});
