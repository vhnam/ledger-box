import * as v from 'valibot';

export const editTransactionSchema = v.object({
  type: v.picklist(['expense', 'income']),
  amount: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty('Amount is required'),
    v.regex(/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/, 'Amount must be a valid number'),
    v.transform(Number),
    v.minValue(0.01, 'Amount must be greater than 0'),
  ),
  description: v.pipe(v.string(), v.trim(), v.nonEmpty('Description is required')),
});

export type EditTransactionInput = v.InferInput<typeof editTransactionSchema>;
export type EditTransactionOutput = v.InferOutput<typeof editTransactionSchema>;
