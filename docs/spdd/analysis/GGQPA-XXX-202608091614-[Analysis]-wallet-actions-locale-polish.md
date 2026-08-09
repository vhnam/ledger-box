# SPDD Analysis: Wallet Actions Filter UX & Locale-Aware Date Display

## Original Business Requirement

> No business requirement document was supplied. Per user instruction ("i forgot to create
> analysis file. Please read the current diff code and write analysis file related to wallet
> actions and locale"), this analysis is **reverse-engineered from the uncommitted working-tree
> diff on `refactor/wallet-polish`**, rather than from a prior ticket. The reconstructed intent
> below is inferred from the diff, not copied from an original ticket:
>
> - Polish the wallet page **Filter** control so the active period is visible at a glance on
>   the trigger (label + optional date preview badge), and so opening the panel feels like a
>   deliberate filter sheet rather than a loose row of selects.
> - Replace the period **Select** with a compact **ToggleGroup** of period presets (All time,
>   Today, This month, Last month, Date range), with sort controls separated visually below.
> - Make period previews and the date-range calendar respect the signed-in user's **app
>   locale** (month names, calendar chrome, and medium/month-medium display patterns), not a
>   hardcoded default.
> - Rename the shared date-format token `Text` → `Medium` and introduce `MonthMedium` so
>   filter chips can show human-readable month labels (e.g. "Jul 2026" / "2026年7月") instead
>   of numeric `MM/yyyy`.
> - Thread the same locale into statement-share period pickers so wallet settings stay
>   consistent with the wallet page.
> - Add catalog strings for the new "Period" section label and date-range placeholder across
>   all supported locales; soften action-button label breakpoints (`lg` → `sm`) for better
>   mobile readability.

**Inferred acceptance criteria (from the diff's observable behavior):**

1. When a non–all-time filter is active, the Filter trigger shows the selected period label
   (and a secondary preview badge when a date preview exists), with a mild primary-tinted
   active style.
2. Period selection uses a single-select ToggleGroup (cannot clear to empty); custom date
   range still appears only when "Date range" is selected.
3. Filter preview for Today / This month / Last month uses locale-aware Medium / MonthMedium
   patterns via `formatDate(..., locale)`.
4. `DatePickerRange` accepts an optional `SupportedLocale` and applies it to both the button
   label and the Calendar (date-fns locale), without forcing UI package consumers to import
   react-intl.
5. Statement-share create dialog passes the app locale into `DatePickerRange`.
6. Shared `DateFormat` / `DateTimeFormat` expose `Medium` (formerly `Text`) and
   `MonthMedium`; unit tests cover Medium and MonthMedium across at least two locales.
7. New message ids `wallet.actions.period` and `wallet.actions.dateRangePlaceholder` exist in
   all seven message catalogs.

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **Wallet Actions (`WalletActions` / `useWalletActions`)**: Wallet-page toolbar owning
  filter/sort URL search state, transfer, and add-transaction entry points. Filter and sort
  map to route search (`filter`, `from`, `to`, `sortBy`, `sortOrder`) via
  `resolveWalletTransactionSearch`; query params for the transaction list are derived in
  `toTransactionQuery` without converting calendar dates to timezone instants client-side.
- **Filter Options (`FILTER_OPTIONS` / `FILTER_OPTIONS_LIST`)**: Preset period vocabulary
  (`all-time`, `today`, `this-month`, `last-month`, `date-range`) with react-intl message ids.
  Default remains `all-time`.
- **Filter Preview**: Derived display string for Today / This month / Last month (null for
  all-time and date-range). Already locale-aware via `useAppLocale` + `formatDate`; this change
  upgrades which **format tokens** are used.
- **App Locale (`useAppLocale` / `LocaleProvider`)**: Signed-in user's `SupportedLocale`
  preference, already used across currency/date display on wallet header, transactions,
  summary, activity, and statement views.
- **Date formatting utilities (`@vhnam/utils/date`)**: `formatDate` / `formatDateTime` resolve
  pattern keys through `LOCALE_DATE_PATTERNS` / `LOCALE_DATE_TIME_PATTERNS` and render month
  names via `LOCALE_DATE_FNS_LOCALE`. Pattern selection is region-sensitive (e.g. en-US vs
  en-GB order); month names come from date-fns locales.
- **DatePickerRange (`@vhnam/ui`)**: Shared range picker used by wallet actions and statement
  shares. Presentational only — placeholder/label strings are passed in from the app;
  formatting previously ignored viewer locale.
- **Statement Shares settings**: Wallet-settings flow that creates a shareable statement for a
  chosen period; already uses `DatePickerRange` for custom ranges.
- **ToggleGroup (`@vhnam/ui`)**: Existing shared control (with Storybook stories); newly
  adopted here as the period selector primitive.
- **i18n message catalogs**: Seven locale JSON files under `packages/utils/src/i18n/messages/`;
  wallet action strings already exist (`wallet.actions.filter`, filter.* keys, sort keys).

#### New Concepts Required

- **DateFormat.Medium / DateTimeFormat.Medium**: Rename of the former `Text` token — same
  semantic (medium, month-name-bearing day date), clearer naming aligned with Numeric / Short
  / Long. Not a new domain entity; a shared vocabulary correction that all pattern tables and
  tests must follow.
- **DateFormat.MonthMedium**: New month-only medium pattern (e.g. `MMM yyyy` / `yyyy'年'M'月'`)
  for filter previews that should read as a month, not `MM/yyyy` numeric. Extends the existing
  format vocabulary rather than inventing a parallel formatter.
- **Locale-aware DatePickerRange**: Optional `locale?: SupportedLocale` on the UI component —
  maps to date-fns locale for Calendar chrome and to `formatDate(..., locale)` for the trigger
  label. Keeps `@vhnam/ui` free of react-intl while closing the gap between app locale and
  picker display.
- **Controlled Filter Collapsible + Active Filter Affordance**: UI-state concept (`filtersOpen`)
  plus visual "filtered" treatment on the trigger (active period label, optional Badge preview,
  caret rotation). Complements URL search state; does not replace it.

#### Key Business Rules

- **URL search remains the source of truth for filter/sort**: ToggleGroup and date picker only
  call existing `setFilterBy` / `setDateRange` / sort setters; clearing `from`/`to` when leaving
  date-range is unchanged.
- **Period ToggleGroup is single-select and non-empty**: Deselecting the only pressed item is
  ignored (`values.at(-1)` with early return) so the user cannot enter an undefined filter
  state — governs period UX.
- **Filter preview is locale-dependent display only**: Changing locale must reformat Today /
  This month / Last month previews; it must not change which transactions are queried.
- **Calendar dates stay calendar dates**: Client still sends `yyyy-MM-dd` for date-range;
  server resolves bounds in the wallet timezone (`resolvePeriodBounds`) — unchanged and must
  stay that way.
- **UI package stays translation-free**: Locale is a typed `SupportedLocale` prop; translated
  placeholders (`Choose dates`, `Period`) are supplied by the app via `useIntl` /
  `FormattedMessage`.
- **All supported locales get catalog parity**: New wallet.actions keys must exist in every
  message file (en-US, en-GB, vi-VN, fr-FR, ja-JP, zh-CN, zh-TW).
- **Format token rename is a breaking API rename within the monorepo**: Any remaining
  `DateFormat.Text` / `DateTimeFormat.Text` references must be updated in the same change
  (diff shows they are fully migrated).

## Strategic Approach

#### Solution Direction

- Treat this as a **frontend UX + locale-display polish** change on an existing wallet filter
  surface — no API, migration, or query-contract changes.
- Reuse existing architectural seams: route search + `useWalletActions` for state;
  `useAppLocale` + `@vhnam/utils/date` for formatting; `@vhnam/ui` ToggleGroup / Badge /
  Separator / DatePickerRange for presentation; react-intl catalogs for copy.
- Data flow stays: Wallet page → `useWalletActions` (search ↔ URL) → `WalletActions` UI →
  transaction query params. Locale only enters the **display** path (filterPreview,
  DatePickerRange labels/calendar).
- Extend shared date vocabulary (`Medium`, `MonthMedium`) in `@vhnam/utils` so wallet actions
  and any future chip/badge previews share one pattern table instead of ad-hoc format strings.

#### Key Design Decisions

- **ToggleGroup vs Select for period**: Trade-off — ToggleGroup uses more horizontal space and
  wraps on narrow screens, but shows all presets at once and matches modern filter-chip UX.
  Select is denser but hides options. → **Recommend ToggleGroup** for the small fixed set of
  five presets; keep Select for sort field/order (larger or less glanceable options).
- **Rename Text → Medium rather than keep Text**: Trade-off — rename is a monorepo-wide token
  churn; keeping Text avoids churn but leaves inconsistent naming next to Numeric/Short/Long.
  → **Recommend rename** while the surface is still small (no external package consumers of the
  token name).
- **Add MonthMedium instead of overloading Month**: Trade-off — another pattern key vs. changing
  `Month` from numeric to named (which would break any caller expecting `MM/yyyy`). →
  **Recommend additive MonthMedium**; leave `Month` numeric for machine-ish displays.
- **Optional locale on DatePickerRange vs. always reading from a context**: Trade-off — optional
  prop keeps UI package free of app LocaleProvider; omitting locale preserves prior default
  behavior for Storybook/tests. Context would auto-wire but couples UI to app. → **Recommend
  optional prop**, threaded from `useAppLocale` at app call sites (wallet actions + statement
  shares).
- **Show filter preview on the closed trigger (Badge) and again inside the open panel**:
  Trade-off — slight duplication vs. discoverability when collapsed. → **Recommend both**: badge
  on sm+ for closed-state clarity; muted text inside the panel for context next to the
  ToggleGroup / date picker.
- **Controlled Collapsible**: Trade-off — local open state vs. uncontrolled. Controlled enables
  caret rotation synced to open and future "open when filter changes" behaviors. → **Recommend
  controlled** `filtersOpen`.

#### Alternatives Considered

- **Keep Select for period and only fix locale formatting**: Rejected — the diff’s primary UX
  goal is glanceable period selection and an active filter affordance; formatting alone would
  not address the cluttered filter bar.
- **Put date-fns locale mapping inside Calendar only, leave formatDate labels defaulted**:
  Rejected — button labels would still show wrong month names / order relative to the calendar
  chrome; both must follow the same locale.
- **Derive preview from Intl.DateTimeFormat instead of LOCALE_DATE_PATTERNS**: Rejected —
  codebase already standardizes on pattern tables + date-fns locales from the i18n work;
  introducing a second path would diverge en-US/en-GB order handling.
- **Hardcode English placeholders in DatePickerRange for the new strings**: Rejected —
  violates project rule that `@vhnam/ui` does not own translations; app passes
  `formatMessage`.

## Risk & Gap Analysis

#### Requirement Ambiguities

- **No written product spec**: Scope and success criteria are inferred from an in-progress
  diff; product intent (e.g. whether custom date-range should also show a trigger badge) is
  not explicitly documented — needs confirmation if date-range should surface `from–to` on the
  closed trigger.
- **Filter panel default open/closed**: Diff defaults to closed (`filtersOpen = false`). Unclear
  whether returning users with an active non-default filter should auto-expand the panel.
- **Duplicate preview**: Preview appears as a Badge on the trigger and as text inside the
  panel for Today/This month/Last month — unclear if that duplication is intentional long-term
  or interim.
- **ToggleGroup multi-value API**: Component API is multi-value (`value={[filterBy]}`);
  single-select behavior is enforced in the handler. Unclear whether a dedicated single-select
  mode exists or should be documented as a usage convention.

#### Edge Cases

- **Locale change while a filter is active**: Preview string must update immediately; URL
  search values must not reset.
- **Date range selected with only `from` (incomplete range)**: Existing `toDateRange` requires
  both `from` and `to`; incomplete picks may not round-trip into controlled value — pre-existing
  behavior, still relevant for the localized picker.
- **Narrow viewports**: ToggleGroup wraps (`flex-wrap`); long translated labels (e.g. Japanese /
  French) may crowd the trigger truncate (`max-w-64`) and badge (`max-w-28`).
- **Empty wallet (`hasTransactions === false`)**: Filter trigger remains disabled — users
  cannot open filters; unchanged, but active-filter styling is irrelevant in that state.
- **Storybook DatePickerRange without locale**: Continues to use default formatting/calendar —
  acceptable, but stories do not yet demonstrate locale variants.

#### Technical Risks

- **Shared format token rename (`Text` → `Medium`)**: Missed call sites would be type errors if
  TypeScript catches them; stringly or dynamic key access would not. Mitigation: grep +
  `vp check` / unit tests (diff already updates utils tests).
- **LOCALE_DATE_PATTERNS / LOCALE_DATE_TIME_PATTERNS must stay key-complete**: Adding
  `MonthMedium` requires every SupportedLocale row to define it — incomplete rows break
  `resolvePattern` at runtime for that locale.
- **date-fns Calendar locale vs. formatDate locale must stay in sync**: DatePickerRange maps
  both from the same `SupportedLocale`; future callers must not pass mismatched pairs.
- **No backend risk**: Filter query contract and timezone resolution are untouched — low
  integrity risk if display-only changes stay display-only.
- **i18n catalog drift**: Seven files updated in the diff; missing a locale would fall back to
  defaultMessage in source for FormattedMessage, but catalog completeness is a project norm.

#### Acceptance Criteria Coverage

| AC# | Description                                                              | Addressable? | Gaps/Notes                                                           |
| --- | ------------------------------------------------------------------------ | ------------ | -------------------------------------------------------------------- |
| 1   | Active filter visible on closed trigger (label + style + optional badge) | Yes          | Date-range has no preview badge by design today — confirm if desired |
| 2   | Period ToggleGroup single-select; date picker only for date-range        | Yes          | Relies on handler ignoring empty selection                           |
| 3   | Locale-aware Medium / MonthMedium filter previews                        | Yes          | Covered in actions + utils tests for sample locales                  |
| 4   | DatePickerRange optional locale for label + Calendar                     | Yes          | Storybook lacks locale story — optional follow-up                    |
| 5   | Statement shares pass app locale into DatePickerRange                    | Yes          | Placeholder still English default unless also customized there       |
| 6   | Shared Medium rename + MonthMedium + tests                               | Yes          | Ensure no residual `Text` references                                 |
| 7   | New wallet.actions strings in all catalogs                               | Yes          | Seven locales present in diff                                        |

---

**Working notes (exploration boundary):** Concepts searched — wallet actions, filter options,
DatePickerRange, DateFormat, useAppLocale, LOCALE_DATE_PATTERNS, statement shares, ToggleGroup,
i18n message catalogs. Related prior SPDD: i18n locale selection/storage/formatting analysis
and settings UI polish analysis. One-hop expansion: filter URL search schema / timezone
calendar-date rule (confirmed unchanged). No DB/API schema changes in scope.
