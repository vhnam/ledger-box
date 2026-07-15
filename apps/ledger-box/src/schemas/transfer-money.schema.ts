import * as v from 'valibot';

export const transferMoneySchema = v.pipe(
  v.object({
    fromWalletId: v.pipe(v.string(), v.nonEmpty('Source wallet is required')),
    toWalletId: v.pipe(v.string(), v.nonEmpty('Destination wallet is required')),
    amount: v.pipe(
      v.string(),
      v.trim(),
      v.nonEmpty('Amount is required'),
      v.regex(/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/, 'Amount must be a valid number'),
      v.transform(Number),
      v.minValue(0.01, 'Amount must be greater than 0'),
    ),
    note: v.pipe(v.string(), v.trim(), v.nonEmpty('Note is required')),
  }),
  v.forward(
    v.partialCheck(
      [['fromWalletId'], ['toWalletId']],
      (input) => input.fromWalletId !== input.toWalletId,
      'Source and destination wallets must be different',
    ),
    ['toWalletId'],
  ),
);

export type TransferMoneyInput = v.InferInput<typeof transferMoneySchema>;
export type TransferMoneyOutput = v.InferOutput<typeof transferMoneySchema>;
