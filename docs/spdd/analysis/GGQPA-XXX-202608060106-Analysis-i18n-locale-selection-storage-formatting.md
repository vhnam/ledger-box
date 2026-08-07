# SPDD Analysis: Internationalization (i18n) — Locale Selection, Storage, and Formatting

## Original Business Requirement

Feature: internationalization (i18n) — locale selection, storage, and formatting.

Read `AGENTS.md` first. This follows two decided items:

- A `currency` field is being added to `wallet`, backfilled to VND, locked after creation.
  Currency and display language must stay decoupled — switching UI language must never
  change which currency is displayed.
- Locale preference lives in User Settings (alongside the existing Appearance/theme tab).
  New-user default is detected from `Accept-Language` at signup, falling back to `en-US`
  when the browser's locale isn't supported. The public `/statement/$token` page follows
  the viewer's own browser `Accept-Language`, independent of the link creator's preference.

Locales to support: `vi-VN`, `en-US`, `en-GB`, `ja-JP`, `fr-FR`.

## Investigate first

- Whether any i18n library or string-translation mechanism exists in the codebase today,
  or whether all UI text is currently hardcoded (likely Vietnamese, given the product's
  primary usage). Report what you find before proposing a library.
- Where date/time formatting currently happens (`@vhnam/utils`, `period-bounds.ts`,
  transaction list, statement builder) and whether it's keyed by a language code (`vi`,
  `en`) or a full locale/region (`en-US` vs `en-GB`) today.
- Whether `CurrencyInput` parses user-typed numbers by assuming a specific decimal/
  thousands separator, or reads it from a formatting library. This determines how much
  work supporting `fr-FR` (space as thousands separator) actually is.
- Whether current fonts/CSS have been checked against Japanese text — spacing assumptions
  that hold for Vietnamese and French (word-separated, similar character width) don't hold
  for Japanese.

## Scope to analyse

- Locale storage: on the `user` row or a separate settings table; format (`vi-VN` full tag,
  not just `vi`).
- Signup-time detection from `Accept-Language`, with the fallback behavior when the
  browser reports a locale outside the five supported (e.g. `zh-CN` → `en-US`), and when
  it reports a supported language but unsupported region (e.g. `en-AU` → nearest supported
  English variant vs `en-US`).
- Region-sensitive formatting distinct from language: `en-US` vs `en-GB` need different
  date order (MM/DD vs DD/MM) despite sharing translated strings. Decide whether string
  translations are keyed by language (`en`) while date/number formatting is keyed by the
  full locale (`en-US` vs `en-GB`), or whether that split is unnecessary complexity given
  actual usage.
- `fr-FR` number formatting: space as thousands separator, comma as decimal separator.
  Specifically address `CurrencyInput` parsing here, since it's the one input where a
  parsing mistake changes a stored amount, not just a display string.
- `ja-JP` layout risk: word-spacing assumptions, font glyph coverage, and whether existing
  compact UI elements (sidebar labels, badges) were sized assuming Latin-script or
  Vietnamese text.
- Currency/language independence: how `formatCurrency` (from the currency work) and locale
  formatting compose — currency unit from `wallet.currency`, everything else (separators,
  date order) from the viewer's locale.
- Public statement page: detecting `Accept-Language` server-side for an unauthenticated
  request, with the same fallback logic as signup detection.

## Surface, before proposing a design

- Translation string management: where strings live, how a missing translation degrades
  (fallback to English text vs. showing a translation key), and whether this needs a
  build-time check to catch missing keys before merge.
- Whether adding a locale switcher to User Settings is additive (new field, new UI
  section) or touches existing Appearance tab layout from the wallet-settings split.
- Test strategy: which existing Storybook stories or Vitest tests need locale variants,
  versus a smaller targeted set (date formatting, currency input parsing, statement page)
  given full coverage across 5 locales for every component is likely disproportionate.
- Whether email templates (recently extracted to typed source files) are in scope for this
  pass, or explicitly deferred — state a recommendation given they're a separate concern
  with their own send-time locale question (recipient's browser isn't available then).

## Codebase Findings (investigate-first questions, answered)

**No i18n/translation library exists.** No `i18next`, `react-intl`, `formatjs`, `next-intl`,
or `lingui` in `pnpm-lock.yaml` or any `package.json`. All UI text is hardcoded string
literals directly in JSX (English, per current source — e.g. "Settings", "Appearance",
"Choose your preferred color theme."), not Vietnamese as the requirement speculated. There
is **no string-translation mechanism of any kind** today — this is a from-scratch addition,
not an extension of existing infra.

**Date formatting is split across two independently-hardcoded paths, neither locale-aware
by region:**

- `packages/utils/src/date/utils.ts` wraps `date-fns` with hand-picked format _patterns_
  (`DateFormat.Numeric = 'dd/MM/yyyy'`, `DateTimeFormat.Numeric = 'dd/MM/yyyy HH:mm'`) —
  DD/MM order is baked into the pattern string itself, with no locale parameter anywhere in
  `formatDate`/`formatDateTime`/`formatRelative`. `date-fns/format` doesn't reorder tokens
  by locale; only month/day _names_ would change if a locale object were passed, and none
  is passed.
- `apps/ledger-box/src/lib/period-bounds.ts` → `formatDateInTimezone` hardcodes
  `new Intl.DateTimeFormat('en-US', { ...pattern, timeZone })` — the `'en-US'` literal is
  the _display_ locale argument to `Intl.DateTimeFormat`, unconditionally, regardless of
  viewer preference. (Separately, `'en-US'` is also used internally in
  `getTimeZoneOffsetMs`/`getZonedDateParts` purely to extract numeric date parts for
  timezone math — that internal usage is locale-agnostic and out of scope to change.)

  Neither path is keyed by language code or full locale today — both are fixed. Supporting
  `en-US` (MM/DD) vs `en-GB` (DD/MM) requires making format _pattern selection_ (not just
  month-name translation) locale-driven, which is new work, not a config flip.

**`CurrencyInput` (`packages/ui/src/components/currency-input.tsx`) hardcodes
`locale: DEFAULT_CURRENCY_LOCALE` (`'vi-VN'`)** — it has no `locale` prop at all, only a
`currency` prop. The parsing/formatting _logic_ underneath (`packages/utils/src/currency/
input.ts`: `parseCurrencyInput`, `formatCurrencyInput`) is properly locale-driven — it calls
`Intl.NumberFormat(locale).formatToParts()` to discover the actual group/decimal separators
for whatever locale string it's given, rather than assuming `.`/`,`. So the **parsing engine
already generalizes correctly to `fr-FR`** (space group, comma decimal) with zero logic
changes — the only gap is that the component call site never threads a locale through; it's
wired to a single constant. This is a narrow, low-risk fix: add a `locale` prop to
`CurrencyInput`, thread the viewer's locale into it at each usage site.

`packages/utils/src/currency/utils.ts` (`formatCurrency`, `formatShortCurrency`,
`formatSignedCurrency`) already accepts `locale` and `currency` as independent
`FormatCurrencyOptions` fields and defaults `locale` separately from `currency`
(`DEFAULT_CURRENCY_LOCALE = 'vi-VN'`, `DEFAULT_CURRENCY_CODE = 'VND'`) — the
currency/language decoupling the requirement asks for is **already the shape of this
function's API**; it's just that every call site today (`app-sidebar-wallets.tsx`,
`wallet-settings-activity.tsx`, `statement-snapshot-view.tsx`, `wallet-summary.tsx`,
`wallet-header.tsx`) passes `currency` only and lets `locale` default to `'vi-VN'`. Wiring
the viewer's locale through these call sites is additive, not a rework of `formatCurrency`
itself.

**No evidence of Japanese-text CSS/layout testing.** No CJK-specific font stack, no
`word-break`/`overflow-wrap` handling found for compact elements (sidebar wallet labels,
badges) beyond default browser behavior. This is an unverified risk, not a known-broken
state — it needs a manual pass with real `ja-JP` strings in the tightest layouts
(sidebar wallet name + balance row in `app-sidebar-wallets.tsx`, activity log rows, wallet
summary stat tiles) once translated strings exist, since compact numeric/badge UI sized for
short Vietnamese/English words may not have been stress-tested for longer Japanese
strings or for font glyph coverage (system fonts generally cover common Japanese kanji, but
this hasn't been confirmed against whatever font stack `packages/ui` currently declares).

**User/locale storage location:** there is no `user` table in the Kysely `Database`
interface (`apps/ledger-box/src/lib/db/schema.ts`) — `wallet`, `walletMember`,
`transaction`, `walletStatementShare`, `walletActivityLog` are the only tables Kysely knows
about. Auth (`apps/ledger-box/src/lib/auth.ts`) is `better-auth`, which manages its own
`user`/`session`/`account` tables via its own schema mechanism, entirely separate from the
hand-written `apps/ledger-box/src/lib/db/migrations/000N_*.ts` files that this repo's
`AGENTS.md` documents as the migration system. This is a real seam: **adding a `locale`
column to `user` means going through better-auth's `additionalFields` config and its own
migration/schema-sync tooling, not writing a `000N_add_user_locale.ts` Kysely migration
like the currency work did for `wallet`.** This is a materially different mechanism than
the `wallet.currency` precedent the requirement cites, and needs to be flagged rather than
assumed identical.

**Accept-Language handling does not exist anywhere in the codebase today** — grepped
across `apps/ledger-box` for `accept-language` (case-insensitive) with zero hits. Both the
signup-detection path and the public statement page's per-viewer detection are new server
logic, not extensions of an existing pattern. `public-statement.mts` (the Netlify Function
serving `GET /api/public/statements/:token`, which the public `/statement/$token` route
consumes) is a plain `Request`/`Response` handler — reading `request.headers.get
('accept-language')` there is straightforward, but the parsing/fallback logic (multi-value
header, quality weights, region-less matches) needs to be written from scratch and shared
with the signup path so the two don't drift.

## Domain Concept Identification

#### Existing Concepts (from codebase)

- `wallet.currency`: the ISO currency code a wallet's amounts are stored/displayed in —
  set at creation, immutable, defaulted to `VND` (migration `0009_add_wallet_currency.ts`).
  Already decoupled from any notion of display language at the data-model level.
- `formatCurrency` / `formatShortCurrency` / `formatSignedCurrency`
  (`@vhnam/utils/currency`): presentation layer that already separates `currency` (unit)
  from `locale` (separator/symbol placement conventions) as independent parameters — the
  mechanism the requirement's currency/language decoupling rule needs already exists here,
  underused.
- `CurrencyInput` (`@vhnam/ui`): the sole user-facing numeric entry point where a parsing
  mistake corrupts a stored amount rather than just a display string. Currently locked to
  `vi-VN` separator conventions regardless of viewer.
- Theme preference (`useTheme`, `settings-appearance.tsx`): the only existing "per-user
  presentation preference" in the app today, stored via `@vhnam/ui`'s theme hook
  (mechanism not yet inspected in depth — likely `localStorage`/cookie, not a `user` DB
  column, since better-auth's `user` table has no such precedent visible). Locale
  preference is conceptually its sibling but a materially different persistence problem if
  it must be a durable, server-known value (needed for signup detection, statement builder,
  and any future server-rendered/emailed content).
- `period-bounds.ts` / `packages/utils/date`: date range computation and display formatting
  for transactions and statements, currently fixed to one display convention.
- `better-auth` `user` table: exists, but outside this repo's own Kysely-migration system —
  any new field on it is a different kind of change than the `wallet.currency` precedent.

#### New Concepts Required

- **User locale preference**: a durable, full BCP-47 locale tag (`vi-VN`, `en-US`, `en-GB`,
  `ja-JP`, `fr-FR`) associated with a user, set at signup via `Accept-Language` detection
  and editable in User Settings. Relates to `better-auth`'s `user` record as its owner;
  independent of `wallet.currency`.
- **Accept-Language parser/matcher**: shared logic that takes a raw header value and the
  five supported locale tags and returns a best match with `en-US` fallback — used at both
  signup and on the public statement page. This is a new, small, pure utility with two
  call sites; it should live once (likely `packages/utils` or an app-level `lib`) rather
  than being duplicated.
- **Translation string catalog**: a new artifact (format/library TBD in REASONS Canvas)
  holding UI strings per supported language, replacing today's hardcoded literals. Relates
  to every existing UI module that currently renders text.
- **Viewer locale context**: the resolved, "currently active" locale for a given render —
  for authenticated views, the signed-in user's stored preference; for the public
  statement page, the anonymous viewer's own browser `Accept-Language` result. These are
  two distinct resolution paths converging on the same downstream formatting calls
  (`formatCurrency`, date formatting, translated strings).

#### Key Business Rules

- **Currency/locale independence**: `wallet.currency` determines the unit symbol/code
  shown; the viewer's locale determines everything else (separators, symbol placement,
  date order, translated strings). Changing UI language must never change which currency
  is displayed — governs `formatCurrency`'s `currency` vs `locale` parameters and every
  call site that must supply `wallet.currency` regardless of viewer locale.
- **Locale is a full region-qualified tag, not a bare language code** — `en-US` and
  `en-GB` must be distinguishable for date-order purposes even though they may share
  translated strings. Governs storage format and the shape of the translation-vs-formatting
  key split (see Risk & Gap Analysis).
- **Unsupported browser locale falls back to `en-US`**, both at signup and on the public
  statement page. Governs the Accept-Language matcher's default branch.
- **Public statement page locale is independent of the link creator** — it must resolve
  from the _viewer's_ request headers, never from the wallet owner's stored preference or
  the statement's `snapshotJson`. Governs `public-statement.mts` and whatever renders
  `/statement/$token`.
- **`CurrencyInput` parsing must match the separator convention of the locale it's
  rendered under** — a `fr-FR` viewer typing "1 234,56" must parse to the same numeric
  value a `vi-VN` viewer typing "1.234,56" would, since this is the one place a formatting
  mismatch corrupts stored data, not just display.

## Strategic Approach

#### Solution Direction

Two largely independent workstreams that share only the concept of "viewer locale":

1. **Formatting decoupling** — thread a `locale: string` parameter through the
   already-locale-aware primitives that exist (`formatCurrency`, `CurrencyInput`,
   `Intl.NumberFormat`-based parsing) and rebuild the _not_-yet-locale-aware ones
   (`packages/utils/date`'s pattern-based `formatDate`, `period-bounds.ts`'s hardcoded
   `'en-US'`) to accept a locale and vary date order/separators accordingly. This is
   incremental — most of the underlying `Intl` machinery is either already in place
   (currency) or a straightforward swap (date, once patterns are replaced with
   `Intl.DateTimeFormat` or locale-aware `date-fns` locale objects).
2. **String translation** — introduce a translation mechanism (library choice deferred to
   REASONS Canvas, but React-ecosystem options like `react-intl`/`i18next` are the
   realistic field given no existing investment either way) and migrate hardcoded UI
   strings to it incrementally, starting with User Settings (where the locale switcher
   itself lives) and expanding by module. Given zero existing investment, this is
   greenfield — the REASONS Canvas should scope an initial slice (e.g., navigation,
   settings, wallet list) rather than a full-app string sweep in one pass. **Scope
   boundary**: whichever library is chosen here handles string translation and its own
   message-level display formatting (e.g., pluralization, interpolated values inside a
   translated string) only. It does not replace or wrap the date/currency formatting
   rework in workstream 1 — `period-bounds.ts` and `packages/utils/date`/`currency` keep
   using native `Intl` and `date-fns` directly, independent of whatever translation
   library is picked. These are two independent workstreams, not one library covering
   both.

Data flow: locale resolution happens once per request/session (signup detection →
persisted on `user`; public statement → resolved per-request from headers, never
persisted) and flows down as a single `locale` value that both the string-translation
layer and the `@vhnam/utils` formatting functions consume independently. `wallet.currency`
flows down as a separate, unrelated value that only the currency formatter consumes.

#### Key Design Decisions

- **Where does `locale` live on `user`?** `better-auth`'s `additionalFields` mechanism vs.
  a separate app-owned settings table keyed by the better-auth user id (mirroring how
  `wallet.tenantId` already treats the better-auth user id as an opaque foreign string
  rather than a true FK). → **Recommend a separate app-owned table** (e.g.
  `user_settings` keyed by `tenantId`/user id), consistent with this codebase's existing
  pattern of never establishing a real FK into better-auth's tables (see `wallet.tenantId`
  comment: "v1: better-auth user id"), and avoiding coupling app migrations to
  better-auth's separate schema-management flow. Trade-off: signup-time write becomes a
  two-step (create better-auth user, then insert app-side settings row) rather than one
  field on one row — but this matches the existing tenancy boundary discipline in
  `AGENTS.md` and keeps the Kysely-migration system as the single source of truth for
  app-owned data, which `additionalFields` would not.
- **Translation keying: language-only (`en`) vs full locale (`en-US`/`en-GB`) for
  strings, vs. full locale for formatting, always.** → Recommend: formatting
  (`Intl.NumberFormat`, `Intl.DateTimeFormat`, `date-fns` locale objects) always keyed by
  the full stored locale tag, since that's what `Intl` natively expects and what produces
  correct `en-US`/`en-GB` date-order divergence for free. Translated _strings_ keyed by
  language only (`en`, `vi`, `ja`, `fr`) is the pragmatic default **unless** a concrete
  need for `en-US`/`en-GB` string divergence surfaces (e.g., "color"/"colour" spelling) —
  given this product has no such copy today, defer that split until content actually
  needs it rather than pre-building two parallel string catalogs for a distinction that
  may never matter. This keeps the string catalog at 4 language variants instead of 5
  locale variants, reducing translation surface by one full set with no loss of
  region-correct formatting.
- **Date formatting rework**: replace `packages/utils/src/date`'s hardcoded pattern
  strings with locale-parameterized formatting (`Intl.DateTimeFormat` with `dateStyle`, or
  `date-fns/locale` imports per supported locale) vs. keeping today's fixed
  `dd/MM/yyyy`-style patterns and only translating month names. → Recommend moving to
  `Intl.DateTimeFormat`-driven formatting (mirroring what `formatDateInTimezone` in
  `period-bounds.ts` already does structurally, just without the hardcoded `'en-US'`)
  since it natively handles date-order divergence per locale without maintaining five
  hand-picked pattern tables, and is consistent with the currency formatter's existing use
  of native `Intl` APIs rather than a custom pattern DSL.
- **`CurrencyInput` locale threading**: add a `locale` prop with a safe default (keep
  `DEFAULT_CURRENCY_LOCALE` as the fallback) vs. requiring every call site to supply it. →
  Recommend an optional prop defaulting to the existing constant so this change is
  backward-compatible everywhere it's currently used without a locale context available,
  while call sites within authenticated flows should pass the resolved viewer locale
  explicitly once available.

#### Alternatives Considered

- **Storing `locale` via better-auth `additionalFields`**: rejected in favor of an
  app-owned settings table — would split "where does app-user data live" across two
  migration systems (better-auth's and this repo's Kysely files) for what is otherwise a
  plain preference value with no auth-specific behavior.
- **Keying string translations by full locale (5-way) from the start**: rejected as
  premature — no current copy differs between `en-US`/`en-GB` or would differ between
  `fr-FR` and a hypothetical other French locale; a language-only key is smaller to
  maintain and can be split later if a real divergence appears.
- **Continuing to hand-pick date-fns pattern strings per locale** (extending today's
  approach to 5 patterns instead of 1): rejected — doesn't scale cleanly to date-order
  divergence (`en-US` vs `en-GB`) without either duplicating logic or building a
  locale→pattern lookup that reinvents what `Intl.DateTimeFormat` already provides.

## Risk & Gap Analysis

#### Requirement Ambiguities

- **"nearest supported English variant vs `en-US`" for something like `en-AU`**: the
  requirement raises this as an open question without deciding it. Needs an explicit
  decision — e.g., "any `en-*` not in the supported list falls back to `en-US`" (simplest,
  consistent with the stated `zh-CN → en-US` rule) vs. some notion of regional proximity
  that doesn't obviously generalize (there's no principled "nearest" between `en-AU` and
  `en-US`/`en-GB`). Recommend the simple rule for REASONS Canvas: unsupported region for a
  supported language still falls back to `en-US` (the single documented fallback target),
  not a per-language nearest-match table — avoids inventing unstated proximity logic.
- **Multi-value `Accept-Language` headers with quality weights** (e.g.
  `fr-CA,fr;q=0.9,en;q=0.8`) are not addressed by the requirement — does matching consider
  only the first value, or walk the full weighted list looking for any supported tag
  before falling back? This materially changes matcher behavior and needs a decision.
- **Can a user change locale after signup, and does that retroactively affect anything
  persisted with locale-dependent formatting** (e.g., a previously-generated statement
  snapshot's `displayTitle`, if any text in it were ever translated)? Statement snapshots
  are captured JSON (`snapshotJson`) — if any translated string were baked into a snapshot
  at creation time, a later locale change wouldn't retroactively update it. Needs
  confirmation that snapshot content (`displayTitle` etc.) is user-authored/currency-only
  and never includes system-translated strings, or the immutability implications need
  surfacing.

#### Edge Cases

- User's browser `Accept-Language` is absent or empty at signup (some clients, some
  automated signups) — matcher must have a defined behavior (fall back to `en-US`) rather
  than throw.
- The public statement page viewer has no `Accept-Language` header at all (e.g., certain
  bots, curl, some in-app browsers) — same fallback needs to apply server-side in
  `public-statement.mts`.
- A translation key is added to one locale's catalog but missed in another during
  incremental rollout — degrade-to-what needs a decision (English fallback string vs.
  visible key) before the string catalog exists, since the answer shapes the catalog's
  data structure (e.g., whether every locale file must have full key coverage or can be
  sparse with a fallback chain).
- `wallet.currency` values outside the four currently mapped in
  `CURRENCY_FRACTION_DIGITS` (`VND`, `JPY`, `USD`, `EUR`) combined with a new locale —
  `getCurrencyFractionDigits` already defaults gracefully (`DEFAULT_MAXIMUM_FRACTION_DIGITS`),
  so this composes safely already; noted as a non-risk given existing defensive coding.
- Existing users (pre-i18n) have no stored locale — a migration/backfill decision is
  needed analogous to `wallet.currency`'s backfill-to-VND, but the "right" default per
  existing user is less obvious than currency's single default (backfilling everyone to
  `en-US` regardless of their actual likely language is a real product decision, not just
  a technical one, since this product's primary usage is Vietnamese per `AGENTS.md`'s
  framing — recommend backfilling existing users to `vi-VN`, not `en-US`, unless product
  input says otherwise, since `en-US` is specifically the _browser-detection-fallback_,
  not a statement about actual user base).

#### Technical Risks

- **Two separate persistence mechanisms for one user-scoped preference domain**
  (better-auth's own tables vs. this repo's Kysely-migrated tables) is a structural risk
  if not made explicit early — picking the app-owned-table approach (see Strategic
  Approach) avoids it, but this must be a deliberate REASONS Canvas decision, not
  discovered mid-implementation.
- **`date-fns` locale objects vs. native `Intl.DateTimeFormat`** for the five target
  locales: `date-fns` requires importing per-locale locale modules (`date-fns/locale/vi`,
  `/en-US`, `/en-GB`, `/ja`, `/fr`) which exist upstream, but mixing `date-fns`-formatted
  strings (used today for relative time, e.g. `formatRelative`) with `Intl`-formatted
  strings (used for absolute dates) risks inconsistent conventions across the app unless
  both paths are given the same locale input consistently.
- **Translation library bundle-size/runtime choice** is unresolved and affects the
  Netlify Functions (server-side) vs. client-side split — if any translated string needs
  to render server-side (e.g., a future translated email, or server-rendered statement
  metadata), the chosen library must work in both the Vite/browser build and the Netlify
  Functions runtime, which the currently-hardcoded strings never had to consider.
- **No current test coverage for locale-sensitive formatting** — `currency/utils.test.ts`
  and `currency/input.test.ts` exist but (unread in detail here) likely test only the
  default `vi-VN`/`VND` path; date formatting has no locale-parameterized tests today
  since there's no locale parameter yet. New tests are additive work, not a modification
  of brittle existing coverage.

#### Acceptance Criteria Coverage

The requirement is stated as an analysis brief rather than a numbered set of acceptance
criteria. The scope items function as de facto ACs; coverage against each:

| #   | Description                                                                                           | Addressable? | Gaps/Notes                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | ----------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Locale storage as full tag (`vi-VN`), on `user` or separate table                                     | Yes          | Recommend separate app-owned table over better-auth `additionalFields`; needs REASONS Canvas decision, not yet made                                                                                                                                                                                                                                                                                     |
| 2   | Signup-time `Accept-Language` detection, fallback to `en-US` for unsupported locale                   | Yes          | Multi-value/quality-weighted header parsing behavior undecided (ambiguity above)                                                                                                                                                                                                                                                                                                                        |
| 3   | Supported-language-unsupported-region fallback (e.g. `en-AU`)                                         | Partial      | Requirement explicitly leaves the exact rule open; recommend simple "any unmatched `en-*` → `en-US`" rather than a nearest-match table                                                                                                                                                                                                                                                                  |
| 4   | Region-sensitive date order (`en-US` MM/DD vs `en-GB` DD/MM) independent of shared translated strings | Yes          | Requires the date-formatting rework identified above (pattern-based → `Intl`/locale-object-based); not currently possible with today's hardcoded `dd/MM/yyyy` pattern                                                                                                                                                                                                                                   |
| 5   | `fr-FR` number formatting incl. `CurrencyInput` parsing correctness                                   | Yes          | Parsing engine (`parseCurrencyInput`) already generalizes via `Intl.NumberFormat`; only the component's missing `locale` prop needs wiring — low risk                                                                                                                                                                                                                                                   |
| 6   | `ja-JP` layout risk (spacing, glyph coverage, compact UI)                                             | Partial      | No existing check; this AC is a verification task (manual QA pass with real Japanese strings) rather than a code change, and depends on the string catalog existing first                                                                                                                                                                                                                               |
| 7   | Currency/locale independence in `formatCurrency` composition                                          | Yes          | Already the shape of the existing API (`currency` and `locale` are independent params); mainly a call-site wiring task                                                                                                                                                                                                                                                                                  |
| 8   | Public statement page: server-side `Accept-Language` detection, independent of link creator           | Yes          | No existing mechanism; new logic in `public-statement.mts` (or wherever `/statement/$token` resolves), sharing the matcher/fallback logic with signup detection                                                                                                                                                                                                                                         |
| 9   | Translation string management, missing-key degradation, build-time check                              | Partial      | Fully open — no existing mechanism; library choice, degradation behavior, and build-time enforcement are all undecided and belong in REASONS Canvas                                                                                                                                                                                                                                                     |
| 10  | Locale switcher additive to User Settings without disrupting existing Appearance tab                  | Yes          | `SettingsDialog`'s tab structure (`Account`/`Appearance`) is a simple enum + `TabsContent` pattern; adding a `Locale`/`Language` tab (or a section within `Appearance`) is structurally additive, not a layout rework                                                                                                                                                                                   |
| 11  | Test strategy scoping (targeted vs. full 5-locale coverage)                                           | Partial      | Recommend targeted: date formatting, `CurrencyInput` parsing (esp. `fr-FR`), and public statement Accept-Language resolution as the priority set; full Storybook coverage across 5 locales for every component is correctly identified as disproportionate and should not be pursued                                                                                                                    |
| 12  | Email templates in/out of scope                                                                       | Partial      | Requirement asks for a recommendation: defer — email templates (`netlify/functions/lib/email-templates/`) render at send-time with no viewer `Accept-Language` available (recipient isn't making the request), so they need a _different_ locale-resolution strategy (stored user locale at minimum, not detection) and are a separable follow-up, not blocked by this pass but not solved by it either |
