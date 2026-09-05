import { formatInTimeZone, LOCALE_DATE_PATTERNS } from '@vhnam/utils/date';
import type { SupportedLocale } from '@vhnam/utils/locale';

function formatSnapshotDate(value: string | null, timezone: string, locale: SupportedLocale): string | null {
  if (!value) {
    return null;
  }

  return formatInTimeZone(value, timezone, LOCALE_DATE_PATTERNS[locale].Numeric, locale);
}

export { formatSnapshotDate };
