# SPDD Analysis: Activity Log Date Filter

## Original Business Requirement

i want to add Filter for Activity Logs. Please implement it

filter by:

- today
- this week
- previous week
- this month
- previous month
- date range

## Domain Concept Identification

### Existing Concepts (from codebase)

- **Wallet activity log**: Append-only audit trail of wallet-scoped mutations (`wallet_activity_log`). Entries are never edited or soft-deleted. Indexed by `(wallet_id, created_at desc)`. Each row has a `created_at` timestamptz recording when the action was logged.
- **Activity log read surface**: Owner-only paginated list via `GET /api/wallets/:walletId/activity` (`requireOwnedWallet`), rendered on wallet settings → Activity. Client today requests only `page` / `pageSize`; no period filter params exist.
- **Period filter (transaction list)**: Shared preset vocabulary (`FILTER_OPTIONS`: all-time, today, this-month, last-month, date-range) plus `resolvePeriodBounds` that converts presets or `from`/`to` calendar dates into half-open UTC instant bounds in the **wallet timezone**. Already used by transaction list and summary APIs against `occurred_at`.
- **Wallet timezone**: Per-wallet IANA timezone used as the calendar authority for “today / this month / date range” when filtering ledger periods. Activity timestamps are UTC instants; calendar interpretation should stay consistent with that wallet clock.
- **Date-range UI pattern**: Wallet actions collapsible filter uses Select + `DatePickerRange`, URL search params for filter state, and resets page when the filter changes. Locale catalogs already hold `filter.*` labels for the existing presets (not week presets).

### New Concepts Required

- **Activity period filter**: A user-selected time window that narrows which activity log entries are returned and counted. Conceptually the same family as the transaction period filter, but applied to **when the action was recorded** (`created_at`), not when a transaction “occurred.”
- **Week period presets**: “This week” and “previous week” as first-class calendar windows. These do **not** exist in the current shared filter vocabulary or in `resolvePeriodBounds`; they are new relative to both activity and transaction filtering.
- **Filtered activity empty / result semantics**: Same list UX as today (pagination, result count, empty state), but totals and pages must reflect the filtered set — not client-side slicing of an unfiltered page.

### Key Business Rules

- **Filter by log time, not transaction occurred time**: Activity answers “what happened to this wallet when?” — the window applies to `created_at` on the log entry. Filtering by nested transaction `occurredAt` inside before/after JSON would misrepresent non-transaction actions and edits that change occurred dates after the fact.
- **Server-side filtering with pagination**: Page size is capped and results are ordered newest-first; period predicates must apply on both the item query and the count query (same pattern as transaction list). Client-only filtering would under-count and skip matches outside the current page.
- **Half-open bounds in wallet timezone**: Presets and date ranges resolve to `[start, endExclusive)` UTC instants using the wallet’s timezone — matching existing period-bound conventions so “today” means the same calendar day as elsewhere in the product.
- **Owner-only read unchanged**: Filtering does not widen who can see the log; authorization remains owner-scoped.
- **Append-only integrity unchanged**: Filtering is read-path only; it must not edit, hide permanently, or soft-delete log rows.
- **Default unscoped view**: When no period is selected (or an “all time” / unset default), behavior stays as today — full history, newest first. The requirement lists only positive presets and does not forbid an all-time default.

## Strategic Approach

### Solution Direction

Extend the existing activity read path (API → query client → wallet settings Activity UI) with the same period-filter model already used for transactions: query params for preset (+ optional `from`/`to`), resolve calendar bounds with the wallet timezone, apply half-open predicates on `created_at`, and surface a filter control on the Activity settings page that resets pagination when the window changes.

Conceptually reuse the shared period-resolution machinery rather than inventing a second calendar engine. Extend that machinery (and the filter vocabulary) to support week presets required for activity, then decide whether those week options also appear on the transaction filter (see design decisions).

Data flow (conceptual): owner opens Activity → selects period preset or custom range → client requests activity with filter params → server resolves bounds in wallet timezone → returns filtered page + filtered total → UI shows matching rows / empty state.

### Key Design Decisions

- **Shared period vocabulary vs activity-only options**
  - **Trade-off**: Extending shared `FILTER_OPTIONS` / `resolvePeriodBounds` keeps one calendar truth and benefits any future consumer; it may also surface “this week / previous week” on the transaction filter if the same list is reused. Activity-only options avoid changing transaction UX but duplicate labeling and bound logic.
  - **Recommendation**: Extend the **shared** period-resolution layer with week presets (single source of truth for “what is a week”). For the Activity UI, expose the requirement’s preset set (plus an implicit all-time / clear default). Whether the transaction filter Select also lists the new week options can stay a small product choice in REASONS Canvas — prefer consistency if the shared list is reused, or a curated activity-specific list if transaction UX should stay unchanged.

- **Week definition (start day)**
  - **Trade-off**: ISO weeks (Monday–Sunday) are unambiguous and easy to test; locale-dependent week starts (e.g. Sunday in en-US) feel more natural to some users but complicate bounds and cross-locale sharing of links/params.
  - **Recommendation**: Define weeks as **Monday-start (ISO-style)** in the wallet timezone unless product explicitly wants locale week-start. Document the choice in UI copy only if users confuse “this week.” Surfacing this as an ambiguity for REASONS Canvas confirmation is required because the requirement did not specify week boundaries.

- **Naming: “previous” vs existing “last”**
  - **Trade-off**: Codebase and catalogs already say “Last month”; the requirement says “previous week / previous month.” Mixing synonyms in the UI is confusing.
  - **Recommendation**: Treat “previous month” as the existing last-month concept; introduce week presets with clear labels (“This week” / “Previous week” or “Last week”) and keep month wording consistent with existing `filter.lastMonth` unless a global rename is desired (out of scope for a focused activity filter).

- **URL/search state vs local component state**
  - **Trade-off**: URL search params (transaction pattern) make filters shareable and survive refresh; local state is simpler on a settings subpage with less navigation coupling.
  - **Recommendation**: Prefer **URL or route search state** on the activity settings route for parity with wallet transaction filtering and to reset page cleanly — but local state is acceptable if REASONS Canvas finds the activity route search schema lighter. Either way, changing the filter must reset to page 1.

- **Date-range incomplete selection**
  - **Trade-off**: Existing `resolvePeriodBounds` returns `null` (no period predicate) when date-range lacks `from`/`to`, which briefly shows all-time results while the user picks dates.
  - **Recommendation**: Keep the same behavior for activity for consistency, unless UX wants to withhold the query until both ends are set — a small UX decision for REASONS Canvas, not a domain change.

### Alternatives Considered

- **Client-side filter of already-fetched pages**: Rejected — pagination and total counts would be wrong; deep history would be unreachable within a period.
- **Filter by nested transaction `occurredAt`**: Rejected — activity includes non-transaction entities; edits can change occurred dates after the log timestamp; audit “when did someone change this” is about `created_at`.
- **Separate activity-only calendar library**: Rejected — duplicates timezone-aware half-open bound logic already proven for transactions/summary.
- **New DB index solely for filters**: Not required as a strategic prerequisite — existing `(wallet_id, created_at desc)` already supports wallet-scoped time-ordered range scans; revisit only if volume evidence appears later.

## Risk & Gap Analysis

### Requirement Ambiguities

- **Week start day unspecified**: “This week” / “previous week” need an explicit Monday-start vs locale-start decision.
- **Default when opening Activity**: Requirement lists only positive filters; whether the default is all-time (current behavior) or a preset (e.g. this month) is unspecified — assume all-time unless product says otherwise.
- **“Previous month” vs existing “Last month”**: Same concept, wording differs; confirm UI label preference.
- **Whether week presets should also appear on the transaction filter**: Shared vocabulary makes this tempting; requirement only asks for Activity.
- **Timezone authority**: Strongly implied to be wallet timezone (product consistency), but not stated; viewer-local timezone would disagree with transaction “today” for the same wallet.

### Edge Cases

- **Empty filtered period**: Must show the existing activity empty state (or equivalent “no activity in this period”) rather than an error; pagination hidden when a single empty page.
- **Date range with from > to**: Not specified; need validation or swap/reject behavior aligned with date picker constraints.
- **Incomplete date range**: Partial selection while picking dates — all-time vs deferred fetch.
- **DST / timezone transitions**: Week and month boundaries must use the same zoned wall-time helpers as existing period bounds to avoid off-by-one hours at transitions.
- **Filter change mid-pagination**: User on page 5 of all-time selects “today” — must land on page 1 of the filtered set.
- **Very large wallets**: Filtered count still hits the same table; index should keep this acceptable, but count queries remain O(matching rows).

### Technical Risks

- **Divergent filter UIs**: Implementing a one-off activity filter without extending `resolvePeriodBounds` risks subtle “today” mismatches vs the ledger. Mitigation: reuse shared bound resolution; only specialize which presets the Activity UI offers.
- **Query-key / cache staleness**: Activity React Query keys today are `['activity', walletId, page]`; omitting filter params would show wrong cached pages when switching periods. Mitigation: include filter identity in the query key (REASONS Canvas detail).
- **i18n catalog gaps**: Week preset labels do not exist yet in message catalogs; all supported locales need entries when presets are added.
- **Authorization regression**: Easy to accidentally switch activity read to `requireWalletAccess` while touching the handler; must keep owner-only.

### Acceptance Criteria Coverage

| AC#           | Description                                         | Addressable? | Gaps/Notes                                                                   |
| ------------- | --------------------------------------------------- | ------------ | ---------------------------------------------------------------------------- |
| 1             | Filter activity logs by **today**                   | Yes          | Resolve day bounds in wallet timezone on `created_at`                        |
| 2             | Filter by **this week**                             | Yes          | Week definition (start day) must be decided; new preset in period resolution |
| 3             | Filter by **previous week**                         | Yes          | Same week definition; adjacent prior week window                             |
| 4             | Filter by **this month**                            | Yes          | Existing this-month period concept reusable                                  |
| 5             | Filter by **previous month**                        | Yes          | Maps to existing last-month period concept; confirm label wording            |
| 6             | Filter by **custom date range**                     | Yes          | Existing date-range + DatePickerRange pattern reusable                       |
| 7 _(implied)_ | Filtered list remains paginated with correct totals | Yes          | Apply bounds to items + count queries                                        |
| 8 _(implied)_ | Unfiltered / default view still shows full history  | Yes          | Assume all-time default unless product overrides                             |
| 9 _(implied)_ | Owner-only access and append-only log unchanged     | Yes          | Read-path only; no schema mutation required for filtering                    |

Open product questions (week start, default period, whether transaction filter gains week presets, “previous” vs “last” month label) should be resolved in REASONS Canvas constraints before implementation.
