# MR 12 — Wallet Balance Concurrency Fix

**Branch:** `feat/audit-wallet` → `main`

### Context

MR 11 granted `manager` role write access to wallets, so two sessions can now
write to the same wallet concurrently (create/edit/delete a transaction, or
transfer). Every balance-mutating handler still read `wallet.amount` into JS,
computed a new absolute value, and wrote it back — a lost-update race once more
than one writer per wallet became possible. An audit (`spdd/analysis/`) confirmed
the race in all four amount-touching paths and found `wallet.mts` (rename /
soft-delete) unaffected, since it never touches `amount`.

### Fixed

#### Atomic wallet balance writes

- `wallet-transactions.mts` (`POST`), `wallet-transaction.mts` (`PATCH`,
  `DELETE`), `wallet-transfer.mts` (both legs) — `wallet.amount` is now updated
  with a SQL-relative expression (`sql\`amount + ${delta}\``) evaluated by
Postgres inside the existing `db.transaction()`, instead of a JS-computed
  absolute value read from a pre-fetched wallet row. Removes the lost-update
  race with no isolation-level change or row locking required — the increment
  is atomic per-row regardless of read timing.
- `wallet.mts` is unchanged; it never mutates `amount`.

### Added

- `netlify/functions/lib/wallet-transactions.test.ts` — concurrency regression
  tests: two concurrent income transactions, and a concurrent income + expense
  pair, against the same wallet, asserting the final `wallet.amount` reflects
  both deltas and matches the independently-summed non-deleted transaction
  total. Run against a real local Postgres, following the existing
  `tenant-access.test.ts` conventions. Lives under `lib/` (not the functions
  directory root) so Netlify doesn't try to deploy it as a serverless function.
- `spdd/analysis/...-wallet-balance-concurrency-audit.md` and
  `spdd/prompt/...-wallet-balance-concurrency.md` — SPDD analysis and REASONS
  Canvas documenting the audit findings and the fix's design decisions.

### Changed

- `apps/ledger-box` `package.json`: `test` script `vitest run` → `vp test run`.

### Setup after merge

```bash
vp install
vp test   # includes the new wallet balance concurrency regression tests
```

No migrations, no new environment variables.

### Commits

- `b2ef4fa` feat(ledger-box): audit wallet balance updates for concurrency safety
