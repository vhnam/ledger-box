import * as v from 'valibot';

import { SUPPORTED_LOCALES } from '@vhnam/utils/locale';

export const updateUserLocaleSchema = v.object({
  locale: v.picklist(SUPPORTED_LOCALES, 'Unsupported locale'),
});

export type UpdateUserLocaleInput = v.InferInput<typeof updateUserLocaleSchema>;
export type UpdateUserLocaleOutput = v.InferOutput<typeof updateUserLocaleSchema>;
