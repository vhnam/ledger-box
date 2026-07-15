# @vhnam/utils

Shared, framework-agnostic utilities for the monorepo — currency and date formatting helpers built on [date-fns](https://date-fns.org).

See the [root README](../../README.md) for monorepo-wide setup.

## Usage

Import by subpath — there's no single barrel export at the package root, though `.` re-exports everything from both modules:

```ts
import { formatCurrency, formatDate } from "@vhnam/utils";

// or scoped to one module
import { formatCurrency, formatSignedCurrency } from "@vhnam/utils/currency";
import { formatDate, getThisMonthRange } from "@vhnam/utils/date";

// constants/types only
import { DEFAULT_CURRENCY_CODE } from "@vhnam/utils/currency/constants";
import { DateFormat } from "@vhnam/utils/date/constants";
```

## Currency (`@vhnam/utils/currency`)

Defaults to VND (`vi-VN` locale, 0 fraction digits).

- `toCurrencyAmount(amount)` — coerce a `number | string` to a finite number (falls back to `0`).
- `roundCurrencyAmount(amount)` — round to 2 decimal places.
- `formatCurrency(amount, options?)` — locale-aware currency string via `Intl.NumberFormat`. Defaults to compact notation (`formatShortCurrency`) for VND, standard notation otherwise.
- `formatShortCurrency(amount, options?)` — compact VND string, e.g. `1.5tr`, `250k`.
- `formatSignedCurrency(amount, type, options?)` — prefixes `+`/`-` based on `'income' | 'expense'`.

Override locale, currency code, fraction digits, or notation via `FormatCurrencyOptions`. Constants: `DEFAULT_CURRENCY_CODE`, `DEFAULT_CURRENCY_LOCALE`, `DEFAULT_MINIMUM_FRACTION_DIGITS`, `DEFAULT_MAXIMUM_FRACTION_DIGITS`.

## Date (`@vhnam/utils/date`)

Wraps [date-fns](https://date-fns.org) with app-specific presets and re-exports the date-fns functions this repo uses directly (`format`, `formatDistanceToNow`, `formatISO`, `parseISO`, `isToday`, `isValid`, `isWithinInterval`, `startOfDay`, `endOfDay`, `startOfMonth`, `endOfMonth`, `subMonths`).

- `toDate(date)` — coerce `Date | string | number` to a `Date` (strings parsed as ISO).
- `formatDate(date, pattern?)` / `formatDateShort` / `formatDateLong` / `formatDateNumeric` — format using the `DateFormat` presets (`Numeric`, `Short`, `Text`, `Long`, `Month`).
- `formatDateTime(date, pattern?)` / `formatDateTimeShort` — format using the `DateTimeFormat` presets (`Numeric`, `Short`, `Text`).
- `formatRelative(date)` — e.g. "3 days ago".
- `formatIsoDate(date)` — ISO 8601 string.
- `isValidDate(date)` / `isDateToday(date)` / `isDateInRange(date, range)`.
- `getTodayRange()` / `getThisMonthRange()` / `getLastMonthRange()` — return `{ start, end }` for a given reference date (defaults to now).

## Structure

```
src/currency/   constants.ts, types.ts, utils.ts
src/date/       constants.ts, types.ts, utils.ts
src/index.ts    re-exports currency + date
```

## Scripts

```bash
pnpm --filter @vhnam/utils check   # type-check via vp check
```
