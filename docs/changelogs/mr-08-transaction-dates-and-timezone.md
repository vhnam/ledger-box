# MR 08 — Transaction Dates & Wallet Timezone

**Branch:** `feat/share-link` → `main`

### Added

#### Schema & migrations

- Migration `0004_add_transaction_occurred_at_and_wallet_timezone` — `transaction.occurred_at` (`timestamptz`, backfilled from `created_at`), `wallet.timezone` (`text`, default `Asia/Ho_Chi_Minh`), index on `(wallet_id, occurred_at)` for non-deleted rows

#### Period bounds & statement computation

- `#/lib/period-bounds.ts` — timezone-aware preset and custom-range resolver (`resolvePeriodBounds`, `calendarDateToOccurredAtStart`, `formatDateInTimezone`); replaces UTC `date-ranges.ts` duplicate
- `#/lib/statement.ts` — internal statement snapshot builder (opening/closing balance, running balance, period totals) using `occurred_at` + wallet timezone
- `#/lib/wallet-summary.ts` — full-period income/expense/net aggregate over all matching transactions (no pagination cap)

#### APIs

- `GET /api/wallets/:walletId/summary` — period-filtered wallet summary (income, expenses, net balance)
- Transaction create/update/transfer accept optional `occurredAt` (`yyyy-MM-dd` calendar date in wallet timezone); default `occurred_at` is current instant when omitted

#### UI

- `DatePicker` component in `@vhnam/ui` and Storybook story
- Add transaction, edit transaction, and transfer dialogs — optional date control (defaults to today in wallet timezone for explicit picks; server defaults to `now()` when omitted)

#### Queries

- `wallet-summary` API client and `useWalletSummary` hook

#### Documentation

- SPDD analysis: `spdd/analysis/GGQPA-XXX-202607272101-[Analysis]-transaction-event-date-timezone.md`

### Changed

- Transaction list filters and default sort use **`occurred_at`** instead of `updated_at` / `created_at`; list and detail display `occurredAt`
- Summary cards use dedicated summary API instead of paginated transaction list (fixes incorrect totals when period has more than one page of rows)
- Custom date-range filters send calendar `from`/`to` strings; server resolves bounds in `wallet.timezone` (fixes UTC boundary bug for presets and custom ranges)
- CSV import scripts set `occurred_at` from source date columns
- `tenant-access` loads `wallet.timezone` for handlers that need period conversion
- `PaginationLink` `size` prop is optional (defaults to `icon`)
- `AGENTS.md` — migration list and API route table updated

### Removed

- `netlify/functions/lib/date-ranges.ts` — superseded by `#/lib/period-bounds.ts`

### Setup after merge

```bash
vp install
pnpm --filter @vhnam/ledger-box db:migrate
```

Run migration `0004` before using transaction date controls or period filters.

### Commits

- `06c00c1` feat(ledger-box): add occurred_at, wallet timezone, and period-aware summary
