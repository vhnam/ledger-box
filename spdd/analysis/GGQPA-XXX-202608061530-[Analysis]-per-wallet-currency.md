# SPDD Analysis: Per-Wallet Currency, Immutable After Creation

## Original Business Requirement

Feature: per-wallet currency, immutable after creation.

Read `AGENTS.md` first. Context: seed data currently uses USD while the app's real usage
is entirely VND; a `currency` field on `wallet` is being added, defaulting to and backing
existing VND-only usage, but built to support other currencies for other self-hosters.

Scope to analyse:

- `wallet.currency` column, migration, backfill to `'VND'` for all existing rows.
- Locked after creation: editable in the create-wallet form only, rejected by
  `PATCH /api/wallets/:walletId` even if present in the request body, not shown as
  editable in wallet settings General.
- `formatCurrency` / `formatShortCurrency` / `formatSignedCurrency` and `CurrencyInput`
  read the currency from the wallet being displayed, not a hardcoded default.
- Decimal precision differs by currency (VND and JPY have none; USD and EUR have two).
  `CurrencyInput` and `amount` storage currently assume integer VND — audit whether this
  is a formatting-layer concern only or reaches the `amount` column's numeric type.
- Cross-currency transfer: `POST /api/wallets/transfer` currently just adds/subtracts the
  same integer on both wallets. Decide whether v1 blocks transfers between wallets with
  different currencies outright, versus attempting conversion — recommend blocking unless
  the codebase already has an exchange-rate concept anywhere.
- Statement snapshots (`#/lib/statement.ts`) and shared statement links: do they display
  wallet currency today, and does a `display_title`-style currency label need adding.

Surface, before proposing a design:

- Whether `amount`'s current column type can safely hold non-integer values for a future
  currency, or whether this needs a migration decision now even though only VND is used
  today. Recommend against speculative schema changes if VND-only usage makes this
  premature.
- Whether CSV import scripts (`scripts/import-csv.ts`, `scripts/import-bank-csv.ts`) need
  to set `currency`, and what happens on import into a wallet whose currency doesn't match
  the source data.
- Whether locking currency at creation is enforced only in the Netlify handler, or also
  needs a DB constraint (trigger or check) given direct DB access is possible for a
  self-hoster.
- Whether seed data should be fixed to VND in the same change, independent of this feature.

Do not produce a REASONS Canvas yet. Output the analysis only.

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **Wallet** (`wallet` table, migration `0001_create_wallet_and_transaction.ts`): the
  core ledger unit — `id`, `name`, `tenantId`, `amount numeric(14,2)`, timestamps, soft
  delete. Owns transactions and is the unit this feature attaches `currency` to.
- **Transaction** (`transaction` table): individual ledger entries with `amount
numeric(14,2)`, `type` (`income`/`expense`), tied to exactly one `wallet_id`. No
  currency of its own today — it inherits the wallet's currency implicitly.
- **Money formatting layer** (`packages/utils/src/currency/*`): `formatCurrency`,
  `formatShortCurrency`, `formatSignedCurrency`, `parseCurrencyInput`,
  `formatCurrencyInput`. Currently all default to `DEFAULT_CURRENCY_CODE = 'VND'` and
  `DEFAULT_MINIMUM_FRACTION_DIGITS = DEFAULT_MAXIMUM_FRACTION_DIGITS = 0` — i.e. the
  formatting layer already models "currency has a fraction-digit count," it's just
  hardcoded to VND's (zero).
- **`CurrencyInput` component** (`packages/ui/src/components/currency-input.tsx`):
  wraps the formatting layer's `parseCurrencyInput`/`formatCurrencyInput` but always
  calls them with `DEFAULT_CURRENCY_INPUT_OPTIONS` — it has no prop for currency or
  fraction digits today, so every consumer gets VND-style (zero-decimal) input
  behavior regardless of context.
- **Wallet transfer** (`transferBetweenWallets` in
  `netlify/functions/lib/wallet-mutations.ts`, invoked by `POST /api/wallets/transfer`):
  moves a single numeric `amount` between two wallets as a linked expense/income pair,
  with no currency-awareness — it assumes both wallets speak the same unit.
  `wallet-transfer.mts` validates the two wallets are distinct and writable but never
  compares any currency-like field.
- **Statement snapshot** (`buildStatement` in `src/lib/statement.ts`): reads
  `wallet.amount` and transaction rows to compute opening/closing balance and per-row
  running balance. Selects only `amount`/`deletedAt` from `wallet` — no currency data
  flows into the snapshot or `StatementSnapshot` type today.
- **Wallet settings General** (`wallet-settings-general.tsx`): today exposes exactly
  two things — rename (name field, `PATCH`) and delete. No other wallet attribute is
  editable here, so there is no existing "locked field" pattern to imitate; this will
  be the first read-only wallet attribute shown/not-shown in this surface.
- **Wallet create dialog** (`wallet-create-dialog.tsx` /
  `wallet-create-dialog.actions.tsx`): today submits only `name` to `POST /api/wallets`.
- **CSV import scripts** (`scripts/import-csv.ts`, `scripts/import-bank-csv.ts`): both
  write `wallet.amount` and `transaction.amount` via `Number(...)` coercion, importing
  into an existing wallet (looked up, not created) or inserting a new one. Neither
  script references `currency` — they predate the field entirely.
- **`seed.ts`**: still present in the repo (`apps/ledger-box/scripts/seed.ts`) despite
  `AGENTS.md` stating "There is no seed script — it was removed." Seed transaction
  amounts are USD-shaped (`4500`, `85.5`, `42.3`, `15.99`, ...) — two-decimal, US-style
  magnitudes — which is the "seed data currently uses USD" the requirement references.
  This is a documentation/code drift worth flagging independent of the currency feature.
- **Tenancy scoping** (`tenant-access.ts` helpers): every wallet mutation already flows
  through `requireOwnedWallet` / `requireWalletWriteAccess`, which is where a
  currency-immutability check would naturally sit if enforced in the PATCH handler.
- **Activity log** (`wallet-mutations.ts`, `recordActivity`): wallet rename and delete
  are already logged in the same transaction as the mutation; a currency field, being
  create-only, would only ever appear in a `create` activity entry, not an `update` one.

#### New Concepts Required

- **`wallet.currency`**: a new column on the existing `wallet` table, not a new entity.
  Its natural type is a short currency-code string (e.g. ISO 4217 `'VND'`, `'USD'`,
  `'JPY'`, `'EUR'`), NOT NULL, defaulted/backfilled to `'VND'`. Conceptually it belongs
  to the wallet's identity, alongside `name` and `tenantId` — set once, at creation.
- **Currency metadata (fraction-digit lookup)**: a small, self-hosted table/map of
  known currency codes to their display fraction digits (VND/JPY → 0, USD/EUR → 2).
  This is new _conceptually_ even though the formatting layer already has the
  fraction-digit knobs — today those knobs are wired to a single hardcoded default,
  not to a per-code lookup. This concept is what lets `formatCurrency`/`CurrencyInput`
  become currency-aware instead of VND-only.
- **Currency-locked mutation boundary**: the rule "currency is settable at
  `POST /api/wallets` time only, and any `currency` key in a `PATCH` body is ignored/
  rejected" is a new business rule, not an existing pattern — `name` is the only
  field PATCH currently touches, and it's freely mutable, so there's no precedent for
  "accept on create, reject on update" in this codebase yet.

#### Key Business Rules

- **Currency is set once, at wallet creation, and never changes** — governs
  `wallet.currency`, the create-wallet form, and `PATCH /api/wallets/:walletId`.
- **All money displayed for a wallet must be formatted in that wallet's currency**,
  not a global default — governs `formatCurrency`/`formatShortCurrency`/
  `formatSignedCurrency`, `CurrencyInput`, wallet summary/header/transaction list/
  transfer dialog, and statement snapshots.
- **Existing rows must not silently change meaning** — every pre-existing wallet is
  VND today (per the business context), so the backfill value for `currency` must be
  `'VND'` unconditionally, not inferred from `amount` or transaction history.
- **Balances must be provable** (existing AGENTS.md invariant, extended by this
  feature) — a transfer that silently mixes currencies (adds a JPY amount to a VND
  wallet) would make a balance un-provable/wrong without throwing, which is exactly
  the class of bug AGENTS.md calls out as serious. This is the strongest argument for
  blocking cross-currency transfers in v1 rather than attempting conversion.
- **No spending categories / minimal surface area** (existing AGENTS.md philosophy) —
  cautions against introducing an exchange-rate/conversion concept speculatively when
  nothing in the requirement or codebase currently needs one.

## Strategic Approach

#### Solution Direction

- Add `wallet.currency` as a plain column via a new migration
  (`0009_add_wallet_currency` or next available number), `text NOT NULL DEFAULT 'VND'`,
  backfilling existing rows implicitly via the column default (Postgres applies the
  default to existing rows when the column is added `NOT NULL DEFAULT ...` in a single
  `ALTER TABLE ADD COLUMN`), removing the need for a separate backfill statement.
- Extend `POST /api/wallets` to accept an optional `currency` in the request body
  (validated against a known/allowed set), defaulting to `'VND'` when omitted, and
  persist it on insert. This is the _only_ write path for currency.
- Harden `PATCH /api/wallets/:walletId` to ignore any `currency` key in the body — it
  already whitelists `name` explicitly (`typeof body.name !== 'string'`), so the fix is
  simply "don't add a currency branch," plus an explicit test asserting a `currency` in
  the body has no effect, to keep the immutability rule from silently regressing.
  Whether to _reject_ (400) vs _silently ignore_ an extraneous `currency` key is a
  design-canvas-level API contract decision — recommend silently ignoring, consistent
  with how the handler already ignores any other unknown body key today (no whitelist
  rejection pattern exists elsewhere in this codebase to imitate).
- Thread `currency` through wherever `wallet.amount` is already selected/returned:
  `GET /api/wallets` (`findAccessibleWallets` projection), `wallet.mts` PATCH/DELETE
  response shapes, `WalletDto`, and the statement snapshot's wallet select in
  `statement.ts`.
- Extend the currency formatting layer (`packages/utils/src/currency`) with a
  currency-code → fraction-digits lookup (a small constant map covering VND, USD, EUR,
  JPY at minimum, generic enough for self-hosters to extend), and change
  `resolveFormatCurrencyOptions`/`resolveCurrencyInputOptions` to derive
  `minimumFractionDigits`/`maximumFractionDigits` from the _passed-in_ currency code
  rather than the VND-shaped constants — while keeping VND as the fallback when no
  currency is supplied, preserving current default behavior for any caller not yet
  updated.
- Give `CurrencyInput` a `currency` prop (or a `fractionDigits`-shaped prop derived
  from it) so callers pass the wallet's currency through explicitly; every current
  call site (add-transaction dialog, edit-transaction form, transfer dialog) must be
  updated to pass the relevant wallet's currency instead of relying on the implicit
  default.
- For transfers: add a currency-match check in `wallet-transfer.mts` (or
  `transferBetweenWallets`) that rejects the request when `fromWallet.currency !==
toWallet.currency`, returning a 400 with a clear message. No conversion logic, no
  exchange-rate concept, in v1.
- For statement snapshots: include `currency` in the wallet select in
  `buildStatement`, add it to `StatementSnapshot`, and use it in
  `statement-snapshot-view.tsx` / `statement-export.ts` wherever `formatCurrency` is
  called, so shared/exported statements render in the correct currency instead of the
  implicit VND default.
- Leave `wallet.amount` / `transaction.amount` column types untouched
  (`numeric(14, 2)`) — see Key Design Decisions below.
- Fix `seed.ts` to use VND-shaped amounts as a small, separate cleanup in the same
  change (see Key Design Decisions).

#### Key Design Decisions

- **`amount` column type**: `numeric(14, 2)` already stores two decimal places and is
  not integer-only — the requirement's framing ("amount storage currently assume
  integer VND") does not match the schema (`0001_create_wallet_and_transaction.ts`
  lines 8, 19). The _application layer_ (seed data aside) currently only ever writes
  whole-number VND amounts and `CurrencyInput`/`packages/utils` are hardcoded to zero
  fraction digits, but that is a formatting/UI constraint, not a storage one. →
  **Recommendation: no schema/migration change needed for `amount`.** Decimal-currency
  support (USD, EUR) is achievable entirely by changing what the formatting layer and
  `CurrencyInput` do with the existing numeric column. This directly satisfies the
  instruction to avoid speculative schema changes.
- **Cross-currency transfer**: block outright vs. attempt conversion. No
  exchange-rate/conversion concept exists anywhere in the codebase (`grep` for
  exchange/conversion/fx-rate returns nothing) or in the requirement's ACs. Attempting
  conversion would require rate sourcing, staleness handling, and rounding rules — all
  out of scope and directly at odds with the "balances must be provable" invariant if
  done informally. → **Recommendation: block transfers between wallets with different
  currencies in v1**, surfaced as a clear validation error, consistent with how
  `wallet-transfer.mts` already returns targeted 400s for other invalid states
  (same-wallet transfer, non-positive amount).
- **Enforcement layer for immutability**: Netlify handler only, vs. handler + DB
  constraint. A self-hoster has direct Postgres access (per the project's
  self-hosted nature) and could `UPDATE wallet SET currency = ...` directly,
  bypassing the API entirely. A DB-level trigger that rejects changes to `currency`
  after row creation would close that gap, but no other "immutable column" pattern
  exists in this schema today to extend (soft-delete and tenancy are enforced by
  query discipline, not triggers) — introducing the first BEFORE UPDATE trigger in
  this codebase is a real precedent-setting choice, not a small addition. →
  **Recommendation: enforce in the API handler as the primary boundary** (matches
  every other invariant in this codebase, all of which rely on handler discipline,
  not DB constraints), and treat a DB-level guard as optional hardening to decide
  explicitly in the REASONS Canvas rather than assume — flag as an open question
  rather than deciding here, since it's a genuine trade-off (defense-in-depth vs.
  first trigger in the codebase, and a self-hoster editing their own DB directly is a
  different threat model than the tenant-isolation checks the handlers exist for).
- **CSV import scripts and currency**: both scripts import into a wallet that is
  either looked up by name/id (existing wallet — inherits its already-set currency,
  which the script never touches) or newly created via a raw insert. Neither script
  currently sets `currency`, so a newly-created wallet from these scripts would fall
  through to the column default (`'VND'`). Whether that's correct depends on the
  source data's actual currency, which these scripts have no way to know today (they
  read raw CSV rows with `amount`/`description`/etc., not a currency field). →
  **Recommendation: for v1, do not add currency detection/mapping to the import
  scripts** — they're VND-only tooling in practice (per the "app's real usage is
  entirely VND" context) and adding currency-awareness here is speculative until a
  self-hoster actually needs to import non-VND data. Worth a one-line comment or
  README note that imported wallets get the default currency, but not new script
  logic.
- **Seed data currency fix**: `seed.ts` exists (contradicting `AGENTS.md`'s claim it
  was removed) and has USD-shaped transaction amounts (`4500`, `85.5`, `42.3`,
  `15.99`). → **Recommendation: fix seed amounts to VND-shaped whole numbers in the
  same change**, since it's directly caused by/adjacent to this feature (the
  requirement explicitly calls out the USD/VND mismatch as motivating context) and is
  a small, low-risk cleanup — not a reason to block the currency feature, but naturally
  bundled with it. Whether to also correct the `AGENTS.md` "no seed script" claim is a
  documentation fix worth doing alongside, independent of currency.

#### Alternatives Considered

- **Storing currency as an enum/check-constrained column vs. free text**: a Postgres
  `CHECK` constraint against a fixed currency list would prevent typos but also
  requires a migration every time a self-hoster wants a new currency — conflicts with
  "built to support other currencies for other self-hosters" as an open-ended goal.
  Rejected in favor of unconstrained `text`, with validation living in the
  application layer's known-currency list (already needed for fraction-digit lookup).
- **Migrating `amount` to `bigint` minor-units (cents) now, ahead of need**: considered
  because some ledger systems store integer minor units to avoid floating-point
  issues. Rejected — `numeric(14,2)` already avoids float rounding problems, the
  column already supports decimals, and this would be a speculative, disruptive
  migration (touching every `amount` read/write in the codebase) with no concrete
  currency need driving it today.
- **Attempting real-time currency conversion for transfers**: rejected per the Key
  Design Decisions above — no exchange-rate concept exists, and building one is
  disproportionate to a "block for now" requirement with no stated urgency.

## Risk & Gap Analysis

#### Requirement Ambiguities

- **PATCH behavior on extraneous `currency` key**: the requirement says "rejected...
  even if present in the request body" — ambiguous between "request is rejected with
  an error" and "the currency value is rejected/ignored but the rest of the request
  succeeds." Needs an explicit decision in the REASONS Canvas (recommendation above:
  ignore, don't error, for consistency with current unknown-key handling).
- **Allowed currency list**: the requirement mentions VND, USD, EUR, JPY as examples
  but doesn't specify the full v1 set or where it's validated (hardcoded list vs. full
  ISO 4217). Needs to be pinned down before implementation.
- **DB-level immutability enforcement**: explicitly left open above — needs a
  decision, not an assumption, since it's a real scope/precedent trade-off.
- **`display_title`-style currency label**: the requirement asks "does a
  `display_title`-style currency label need adding" to statements, but no
  `display_title` concept was found anywhere in the codebase (`statement.ts`,
  `statement-export.ts`, `statement-snapshot-view.tsx` have no such field) — this
  appears to be a hypothetical/illustrative reference from the requirement author
  rather than an existing pattern to extend. Needs clarification on what UI surface
  is actually meant (e.g., a currency code shown next to amounts in the statement
  view/export, vs. some new titled field).

#### Edge Cases

- **Wallet with pending/unsettled cross-currency transfer at feature launch**: not
  applicable — transfers are atomic and immediate in this codebase (no pending
  state), so no migration-time reconciliation is needed.
- **Existing wallets with non-VND-shaped historical `amount` values** (e.g. any data
  imported via the USD-shaped seed script in a real deployment): backfilling
  `currency = 'VND'` for all existing rows per the requirement's explicit instruction
  means these amounts will now display as VND regardless of their original intent.
  This is the requirement's own explicit call, but worth flagging as a real-world
  data-correctness risk for any self-hoster who already imported non-VND data before
  this feature ships.
- **`formatCurrency` callers that don't yet have a wallet in scope** (e.g. any
  component that formats an amount without direct wallet access, aggregating across
  wallets): once currency becomes wallet-specific, any cross-wallet aggregate display
  (if one exists, e.g. a dashboard summing multiple wallets) becomes ambiguous if
  wallets have different currencies. Needs auditing during design — not found in the
  scoped exploration above, but the transaction list / wallet summary components
  should be checked for any place that formats an amount without a specific wallet's
  currency in scope.
- **Wallet member invite flow / `wallet-member-response.ts`**: this file was found to
  reference `formatCurrency`-adjacent wallet data in the initial concept search;
  confirm during design whether wallet currency needs to be included in any
  member-facing response payload.

#### Technical Risks

- **Fraction-digit assumptions baked into `CurrencyInput`'s digit-only parsing**: the
  component's caret-position and digit-stripping logic
  (`getCurrencyInputCaretPosition`, `normalizeRawCurrencyValue`) already has
  conditional branches for `maximumFractionDigits === 0` vs. `> 0` — the two-decimal
  path exists and has test coverage (`input.test.ts`), reducing risk, but every call
  site needs the currency threaded through correctly or it'll silently keep using the
  VND-shaped default (a formatting bug, not a data bug, but a real regression risk
  during rollout).
  the change touches ~10 UI files (all the `formatCurrency`/`CurrencyInput` consumers
  found above) plus the transfer, statement, CSV, and seed layers — a wide but
  shallow surface area. Coordinated, mechanical changes; low individual complexity,
  moderate risk of missing one call site.
- **Backfill correctness depends on the migration mechanism**: using
  `ADD COLUMN currency text NOT NULL DEFAULT 'VND'` in one statement backfills
  existing rows automatically via the column default (Postgres semantics), avoiding a
  separate `UPDATE` pass — but this must be verified against the Kysely migration
  API's actual generated SQL during implementation, not assumed.

#### Acceptance Criteria Coverage

| AC# | Description                                                                                                                 | Addressable? | Gaps/Notes                                                                                                                                                                        |
| --- | --------------------------------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `wallet.currency` column, migration, backfill to `'VND'` for all existing rows                                              | Yes          | Single-statement `ADD COLUMN ... DEFAULT 'VND'` covers both; confirm Kysely generates this correctly                                                                              |
| 2   | Currency locked after creation: editable at create only, rejected by PATCH, not shown editable in settings General          | Partial      | Create-form and PATCH-ignore are straightforward; "rejected by PATCH" needs the ignore-vs-error decision above; DB-level lock is an open design question, not yet resolved        |
| 3   | `formatCurrency`/`formatShortCurrency`/`formatSignedCurrency`/`CurrencyInput` read currency from the wallet being displayed | Yes          | Requires threading `currency` through ~10 call sites plus a fraction-digit lookup table; mechanical but must be exhaustive                                                        |
| 4   | Decimal precision differs by currency; audit whether this is formatting-layer or reaches `amount`'s numeric type            | Yes          | Fully answered here: formatting-layer only, `amount` already supports decimals, no schema change needed                                                                           |
| 5   | Cross-currency transfer: decide block vs. convert                                                                           | Yes          | Recommendation is to block; no exchange-rate concept exists to build on                                                                                                           |
| 6   | Statement snapshots and shared statement links: do they display currency today, does a label need adding                    | Partial      | Confirmed they do not display currency today; the exact "`display_title`-style" ask is ambiguous (see Requirement Ambiguities) and needs clarification on the intended UI surface |
