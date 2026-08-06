import * as v from 'valibot';

export const transferMoneySchema = v.pipe(
  v.object({
    fromWalletId: v.pipe(v.string(), v.nonEmpty('validation.transfer.from.required')),
    toWalletId: v.pipe(v.string(), v.nonEmpty('validation.transfer.to.required')),
    amount: v.pipe(
      v.string(),
      v.trim(),
      v.nonEmpty('validation.amount.required'),
      v.regex(/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/, 'validation.amount.invalid'),
      v.transform(Number),
      v.minValue(0.01, 'validation.amount.min'),
    ),
    note: v.pipe(v.string(), v.trim(), v.nonEmpty('validation.note.required')),
    occurredAt: v.optional(v.pipe(v.string(), v.isoDate())),
  }),
  v.forward(
    v.partialCheck(
      [['fromWalletId'], ['toWalletId']],
      (input) => input.fromWalletId !== input.toWalletId,
      'validation.transfer.walletsDifferent',
    ),
    ['toWalletId'],
  ),
);

export type TransferMoneyInput = v.InferInput<typeof transferMoneySchema>;
export type TransferMoneyOutput = v.InferOutput<typeof transferMoneySchema>;
