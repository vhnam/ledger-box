import * as v from 'valibot';

export const createWalletSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.nonEmpty('Wallet name is required')),
});

export const updateWalletSchema = createWalletSchema;

export type CreateWalletSchema = v.InferOutput<typeof createWalletSchema>;
export type UpdateWalletSchema = v.InferOutput<typeof updateWalletSchema>;
