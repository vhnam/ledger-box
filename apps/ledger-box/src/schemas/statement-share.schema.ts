import * as v from 'valibot';

export const createStatementShareSchema = v.object({
  periodFrom: v.pipe(v.string(), v.isoDate()),
  periodTo: v.pipe(v.string(), v.isoDate()),
  displayTitle: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(80, 'Title must be 80 characters or fewer'))),
  expiresAt: v.optional(v.nullable(v.pipe(v.string(), v.isoTimestamp()))),
});

export type CreateStatementShareInput = v.InferInput<typeof createStatementShareSchema>;
export type CreateStatementShareOutput = v.InferOutput<typeof createStatementShareSchema>;
