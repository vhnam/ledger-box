# SPDD Analysis: Transaction Event Date and Wallet Timezone

## Original Business Requirement

Feature: correct date semantics for transactions — event date and wallet timezone.

This is a prerequisite for the read-only statement link. See
`docs/decisions/share-link.md` for the decisions that led here, and `AGENTS.md` for
tenancy, soft-delete, and money-handling rules.

Problem: a transaction currently has no user-supplied event date, and period boundaries
are not computed in a consistent timezone. Both mean a transaction can be counted in the
wrong period. Totals across all time stay correct; per-period totals do not — and
per-period totals are exactly what a statement shows.

Scope to analyse:

- An event-date column on `transaction`, distinct from `created_at`, editable by the user.
- Backfill strategy for existing rows.
- A timezone on `wallet`, used server-side for all period boundary computation.
- Migrating existing filters, sorting, and summary cards onto the new semantics.
- What the add- and edit-transaction forms expose, and sensible defaults.

Surface, before proposing a design:

- Whether this is one migration or two, and the ordering risk either way.
- What happens to already-saved URL search params (filter/sort are URL-backed) if the
  column they sort on changes.
- Whether existing summary numbers will visibly change for the user after deploy, and
  whether that needs communicating.
- Whether `created_at` retains any role, given `AGENTS.md` treats it as an audit trail.
- Whether the CSV import scripts need to populate the new column, and from what.

Do not produce a REASONS Canvas yet. Output the analysis only.

## Domain Concept Identification

### Existing Concepts (from codebase)

- **Transaction**: Income/expense row with `amount`, `description`, `walletId`; balance impact is atomic with wallet updates. Timestamps today: `created_at`, `updated_at`, `deleted_at` only — no event date (`schema.ts`, migration `0001`).
- **Wallet**: Named balance container with `tenant_id`, soft-delete. No timezone column today.
- **Period filtering (authenticated)**: `GET /api/wallets/:walletId/transactions` applies date presets and custom ranges against **`updated_at`** via server-side `date-ranges.ts` (UTC `setHours` logic). Client sends filter enum or calendar `from`/`to` strings; for custom range the client also pre-converts to ISO instants before the server re-normalizes (`wallet-actions.actions.tsx`, `wallet-transactions.mts`).
- **Period summary (authenticated UI)**: `WalletSummary` aggregates income/expense/net from the same filtered transaction query as the list (`wallet-summary.actions.tsx`) — inherits filter semantics and the 100-row page cap.
- **Transaction list display**: Rows show **`createdAt`** formatted, while filters use **`updatedAt`** — already inconsistent.
- **URL-backed search state**: Wallet page validates `filter`, `from`, `to`, `sortBy`, `sortOrder`, `page` via `wallet-transaction-search.schema.ts` and TanStack Router `stripSearchParams` defaults (`sortBy: createdAt`, `sortOrder: desc`).
- **Add/edit transaction**: Formisch + Valibot; fields are type, amount, description only — no date (`add-transaction.schema.ts`, `edit-transaction-dialog`). POST/PATCH set `updated_at` on every write; edits bump `updated_at` and can move rows across filter periods.
- **CSV import**: Two scripts — `import-csv.ts` (ledger-box export: uses `created_at`/`updated_at` columns) and `import-bank-csv.ts` (uses `transaction.date` for both `created_at` and `updated_at` on insert).

### New Concepts Required

- **`occurred_at` (event date)**: User-meaningful instant for when money moved; sole column for period membership, statement ordering, and default list sort. Distinct from audit timestamps.
- **`wallet.timezone`**: IANA zone (default `Asia/Ho_Chi_Minh`); authoritative source for converting calendar dates to UTC bounds server-side.
- **Timezone-aware period resolver**: Single server helper replacing duplicate `date-ranges.ts` / client ISO boundary encoding; inputs preset or `from`/`to` calendar dates + wallet timezone; outputs UTC instants for SQL.

### Key Business Rules

- **All-time wallet balance unchanged**: `wallet.amount` and non-deleted transaction sums are not modified by this feature — only per-period views change.
- **Period membership is stable under edit**: Editing amount or description must not change which period a transaction belongs to unless the user explicitly changes the event date (`docs/decisions/share-link.md` Decision 2).
- **Soft-delete unchanged**: Period queries continue to exclude `deleted_at IS NOT NULL` rows.
- **Tenancy unchanged**: All handlers remain scoped via `tenant-access.ts`; this feature does not add public routes.
- **Backfill honesty**: Existing rows never had a user-supplied event date; `occurred_at = created_at` is the best available proxy until the owner edits individual rows.
- **Prerequisite gate**: Share-link feature (`0005`) must not ship until this semantics fix (`0004`) is deployed (`docs/decisions/share-link.md` Prerequisites).

## Strategic Approach

### Solution Direction

Deliver as a **single cohesive release** (migration `0004_add_transaction_occurred_at_and_wallet_timezone` per decision record): schema changes, server period resolver, API filter/sort migration, form changes, list display update, and import script updates. Data flow: owner picks calendar date in wallet timezone → server stores `occurred_at` as `timestamptz` → all period queries filter/sort on `occurred_at` with bounds computed server-side from `wallet.timezone` → summary cards consume the same API query.

Leverage existing patterns: Kysely migrations, Valibot schemas in `src/schemas/`, Formisch forms, Netlify function handlers, `@vhnam/utils` for display formatting (extend with timezone-aware format helpers or pass zone from wallet).

### Key Design Decisions

- **One migration, not two** (`occurred_at` + `wallet.timezone` together): Decision 6 in `share-link.md` — calendar event date without a known zone is ambiguous; timezone fix without event date leaves period membership on `updated_at`, which edits corrupt. **Ordering risk if split:** shipping `occurred_at` first with UTC boundaries still wrong for UTC+7; shipping timezone first still filters on `updated_at` so edits reshuffle periods. **Recommendation:** one atomic `0004` + one app deploy.

- **Backfill `occurred_at = created_at`**: Best proxy for historical data. Rows edited in the past have `updated_at > created_at` — after migration, those rows **leave** the period they appeared in under old `updated_at` filters and **enter** the period of `created_at`. This is a deliberate correction, not a regression.

- **Server-only boundary computation**: Client sends preset enum or `yyyy-MM-dd` pair; remove `startOfDay(...).toISOString()` from `toTransactionQuery` for API calls. Server loads wallet timezone and resolves bounds once.

- **Forms**: Add-transaction — date defaulting to **today in wallet timezone** (calendar date control, not datetime unless needed later). Edit-transaction — show `occurred_at` as editable date; PATCH sends date only when changed; amount/description-only edits do not touch `occurred_at` or `updated_at` period membership (only `updated_at` audit bump).

- **Sort/filter URL params**: Add `occurredAt` to sort options; make it the **default**. Keep `createdAt` and `updatedAt` as optional sort keys for audit/debug views. Preset filter values (`today`, `this-month`, etc.) unchanged in URL — behavior changes server-side. Custom `from`/`to` stay ISO dates in URL (`wallet-transaction-search.schema.ts` already validates `isoDate()`).

- **`created_at` / `updated_at` roles**: **`created_at`** — immutable audit: when the row first entered the system. **`updated_at`** — last modification (amount, description, or event date change); never used for period boundaries. **`occurred_at`** — business event date for statements, filters, summaries, default display.

- **CSV import**: Both scripts must write `occurred_at`. `import-bank-csv.ts` → `transaction.date`. `import-csv.ts` → prefer `occurred_at` column if present in export, else `created_at`. Wallets imported without timezone column get default `Asia/Ho_Chi_Minh`.

- **User-visible summary change**: Yes — preset filters and summary cards will change for UTC+7 users (bug fix) and for wallets with edited transactions (column fix). Communicate in changelog / brief in-app note on first visit after deploy; no data migration of balances.

### Alternatives Considered

- **Two migrations (`occurred_at` then `timezone`)**: Rejected — intermediate states remain incorrect; doubles deploy coordination.
- **Use `created_at` as event date without new column**: Rejected — cannot backdate; bank import already treats `date` as event semantics; edits still confuse if we later filter on `created_at` but bump `updated_at`.
- **Client-computed UTC bounds with timezone**: Rejected — duplicates logic, trusts client clock, repeats today's double-conversion bug.
- **Store date-only (`date` type) without `timestamptz`**: Rejected — loses ordering within a day; `timestamptz` + wallet zone is sufficient for day-level statements v1.

## Risk & Gap Analysis

### Requirement Ambiguities

- **Datetime vs date-only control**: Decision record specifies calendar date in wallet timezone. v1 can store start-of-day instant in that zone; time-of-day within a day is out of scope unless product asks later.
- **Per-wallet timezone UI**: Deferred — all wallets default `Asia/Ho_Chi_Minh`. Importers or future settings must set zone explicitly when non-VN users appear.
- **Summary card completeness**: `useWalletSummary` only sums the first 100 transactions in the filtered set — pre-existing cap means summary can under-report dense periods independent of this feature. Boundary context for REASONS Canvas; not introduced by `0004`.

### Edge Cases

- **Edited transactions**: After deploy, row appears in period of original `created_at` (backfill), not last edit date — user may need to adjust `occurred_at` manually if they had been mentally using edit date.
- **Bookmarked `sortBy=createdAt`**: Still valid; list order changes only if user relied on default. Bookmarked `sortBy=updatedAt` continues to work but is no longer the default.
- **Bookmarked custom `from`/`to`**: Dates in URL remain valid strings; server reinterpretation in wallet timezone may include/exclude edge transactions differently than old UTC/double-conversion logic — expected correction.
- **Transfer pair**: Both legs get `occurred_at = now` today on create; future add-transaction date applies to both legs consistently when transfer form gains date (transfer may need same date default in same release or follow immediately).
- **Midnight boundary**: Transaction at 06:00 ICT on 1 Jul stored as that instant; July preset in `Asia/Ho_Chi_Minh` includes it — fixes UTC mis-bucketing.

### Technical Risks

- **Duplicate date helpers**: `packages/utils/date` and `netlify/functions/lib/date-ranges.ts` diverge today — consolidation required; utils may gain timezone parameters for **display only**; bounds logic lives server-side only.
- **Migration ordering**: `0004` must run before any code expects `occurred_at` NOT NULL — standard deploy: migrate then deploy functions + client together.
- **Edit handler**: Must not update `occurred_at` when PATCH body omits date — prevents accidental period moves; explicit regression risk if conflated with `updated_at` bump.
- **Import scripts run post-migration**: Scripts must include `occurred_at` in inserts or DB default must apply; prefer explicit mapping in scripts for clarity.

### Deep-Dive: Scoped Analysis Questions

#### One migration or two?

**One (`0004`).** Splitting creates a window where either period column or period zone is wrong. Atomic release matches `docs/decisions/share-link.md` Decision 6 and keeps share-link prerequisite unambiguous (`0005` follows `0004`).

#### URL search params after column change

- **`filter`**: Enum values unchanged; semantics change server-side (correct for timezone + `occurred_at`). Bookmarks keep working.
- **`sortBy`**: Add `occurredAt`; change default from `createdAt` to `occurredAt` in `WALLET_TRANSACTION_SEARCH_DEFAULTS` and `sort-options.ts`. Old URLs with `?sortBy=createdAt` remain valid (explicit override). URLs with no `sortBy` get new default after `stripSearchParams` — user sees re-sorted list.
- **`from`/`to`**: Remain `yyyy-MM-dd`; stop client-side ISO conversion before API call; server interprets in wallet timezone — bookmarked date ranges may return slightly different row sets (bug fix).

#### Will summary numbers visibly change?

**Yes, for many users.** (1) UTC+7 owners using “today” / “this month” near zone boundaries. (2) Owners who edited transactions (old filter tracked `updated_at`). (3) Any custom range affected by double conversion. All-time wallet header balance does **not** change. **Recommend:** one-line changelog entry and optional dismissible banner on wallet page first load after deploy (“Transaction periods now use event date and your local timezone”).

#### `created_at` role after `occurred_at`

Retains **audit** meaning: when the record was first created in Ledger Box. Shown only if user sorts by created date or in a future audit detail — default list display switches to **`occurred_at`**. `updated_at` remains internal/audit for last change. Neither participates in period boundaries.

#### CSV import

**Yes, both scripts must populate `occurred_at`:**

- `import-bank-csv.ts`: `occurred_at = transaction.date` (already the semantic event field; today copied to `created_at`/`updated_at`).
- `import-csv.ts`: `occurred_at = transaction.occurred_at` if column exists, else `transaction.created_at` (same as backfill rule).
- Wallets: set `timezone` default on insert; allow optional `timezone` column in CSV later — v1 default suffices.

### Acceptance Criteria Coverage

| AC# | Description                                                 | Addressable? | Gaps/Notes                                                   |
| --- | ----------------------------------------------------------- | ------------ | ------------------------------------------------------------ |
| 1   | Event-date column distinct from `created_at`, user-editable | Yes          | `0004` + form/API changes                                    |
| 2   | Backfill strategy for existing rows                         | Yes          | `occurred_at = created_at`; documented limitation            |
| 3   | Timezone on wallet, server-side period bounds               | Yes          | `wallet.timezone` + resolver; default `Asia/Ho_Chi_Minh`     |
| 4   | Migrate filters, sort, summary to new semantics             | Yes          | API + defaults + display; summary 100-row cap pre-exists     |
| 5   | Add/edit forms with sensible defaults                       | Yes          | Today in wallet TZ; edit preserves date unless changed       |
| 6   | Prerequisite for share-link                                 | Yes          | Blocks `0005` until shipped                                  |
| 7   | All-time totals unchanged                                   | Yes          | No balance migration                                         |
| 8   | CSV import populates new column                             | Yes          | Both scripts need update in same release                     |
| 9   | URL bookmarks remain parseable                              | Yes          | Sort/filter params backward compatible; behavior may correct |

**Resolved upstream (not re-opened):** Snapshot, token, public route — remain in `docs/decisions/share-link.md`; this analysis feeds prerequisite 1 only.
