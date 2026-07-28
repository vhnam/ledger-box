# MR 13 — Wallet Activity Log

**Branch:** `feat/activity-log` → `main`

### Context

MR 11 gave `manager` write access to wallets, transactions, and attachments. Before
that, only the owner could change anything, so "who changed this" had one answer.
Now a wallet balance can change without the owner knowing who caused it. This
product holds money on behalf of other people — the owner must be able to account
for every change.

### Added

#### Append-only wallet activity log

- Migration `0007_create_wallet_activity_log` — append-only table (no `updated_at` /
  `deleted_at`), soft entity references (no cascading FKs), indexed by
  `(wallet_id, created_at desc)`
- `netlify/functions/lib/activity-log.ts` — `recordActivity` inserts one log row;
  money and admin mutations call it inside the same Postgres transaction as the
  recorded action
- `netlify/functions/lib/wallet-mutations.ts` — shared create/update/soft-delete
  transaction and transfer helpers that always log (relative SQL balance updates
  preserved from MR 12)
- `GET /api/wallets/:walletId/activity` — owner-only paginated feed; computes
  `affectsActiveStatementShare` at read time against active statement shares
  (period-level; does not rewrite `snapshot_json`)
- Wallet settings **Activity** section — owner-only chronological feed with actor,
  action, entity summary, optional before/after detail, and statement-divergence
  badge
- `GET /api/wallets` items now include `role` (`owner` | `manager` | `viewer`) so
  the UI can gate owner-only surfaces
- Vitest coverage in `netlify/functions/lib/activity-log.test.ts` (manager money
  mutations, dual-wallet transfer logs, soft-delete survival, members/shares,
  non-owner denial, same-transaction rollback on log failure)
- SPDD analysis and REASONS Canvas under `spdd/analysis/` and `spdd/prompt/`

### Changed

- Transaction access helpers select `description` and `occurredAt` so update/delete
  before-snapshots are complete
- Money handlers (`wallet-transactions`, `wallet-transaction`, `wallet-transfer`)
  delegate ledger writes to `wallet-mutations.ts`
- Wallet rename/delete, member invite/role/remove, and statement-share create/revoke
  record activity in the same DB transaction as the mutation (preview create stays
  unlogged)
- Related TanStack Query mutations invalidate `['activity', walletId]`

### Out of scope (v1)

- Attachment upload/delete logging
- Wallet create logging
- Invite auto-activation logging inside `requireWalletAccess`
- Historical backfill of pre-deploy mutations

### Setup after merge

```bash
vp install
pnpm --filter @vhnam/ledger-box db:migrate   # applies migration 0007
vp test                                       # includes new activity-log tests
```

No new environment variables.

### Commits

- `0cf1812` feat(ledger-box): add owner-only wallet activity log
