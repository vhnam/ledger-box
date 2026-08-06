import * as v from 'valibot';

export const editTransactionSchema = v.object({
  type: v.picklist(['expense', 'income']),
  amount: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty('validation.amount.required'),
    v.regex(/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/, 'validation.amount.invalid'),
    v.transform(Number),
    v.minValue(0.01, 'validation.amount.min'),
  ),
  description: v.pipe(v.string(), v.trim(), v.nonEmpty('validation.description.required')),
  occurredAt: v.optional(v.pipe(v.string(), v.isoDate())),
});

export type EditTransactionInput = v.InferInput<typeof editTransactionSchema>;
export type EditTransactionOutput = v.InferOutput<typeof editTransactionSchema>;
