import * as v from 'valibot';

export const WALLET_CURRENCIES = ['VND', 'USD', 'EUR', 'JPY'] as const;

export const createWalletSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.nonEmpty('Wallet name is required')),
  currency: v.picklist(WALLET_CURRENCIES),
});

export const updateWalletSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.nonEmpty('Wallet name is required')),
});

export type CreateWalletSchema = v.InferOutput<typeof createWalletSchema>;
export type UpdateWalletSchema = v.InferOutput<typeof updateWalletSchema>;
