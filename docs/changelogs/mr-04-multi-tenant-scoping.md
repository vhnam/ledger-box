# MR 04 — Multi-Tenant Scoping

**Branch:** `feat/multi-tenant` → `main`

### Added

#### Multi-tenant security

- Shared-schema tenancy (v1): each wallet is owned by a `tenant_id` equal to the better-auth user id (1 user = 1 tenant)
- Migration `0002_add_wallet_tenant_id` — adds required `wallet.tenant_id`, backfills existing rows to the earliest better-auth user when present, deletes orphan wallets, and indexes `tenant_id`
- Kysely `WalletTable.tenantId` on the database schema
- Shared Netlify helper `netlify/functions/lib/tenant-access.ts` with `getTenantId`, `requireOwnedWallet`, and `requireOwnedTransaction`
- All wallet/transaction Netlify handlers now scope reads and writes to the authenticated tenant:
  - `GET` / `POST` `/api/wallets`
  - `POST` `/api/wallets/transfer`
  - `GET` / `POST` `/api/wallets/:walletId/transactions`
  - `PATCH` / `DELETE` `/api/wallets/:walletId/transactions/:transactionId`
  - `GET` / `POST` `/api/wallets/:walletId/transactions/:transactionId/attachments`
  - `DELETE` `/api/wallets/:walletId/transactions/:transactionId/attachments/:attachmentId`
- New wallets are created with `tenantId` from the session user

#### Attachments (R2)

- Tenant-scoped R2 object keys: `tenants/{tenantId}/transactions/{transactionId}/...`
- List and delete still resolve legacy (pre-tenant) keys under `transactions/{transactionId}/...` for existing files

#### Tooling

- `scripts/import-csv.ts` — upsert wallet/transaction rows from ledger-box CSV exports
- `scripts/import-bank-csv.ts` — import `bank_accounts.csv` + `transactions.csv` into `wallet` / `transaction` (maps `user_id` → `tenant_id`, `account_id` → `wallet_id`, computes wallet balances)

### Changed

- Wallet transfer and transaction create/update/delete paths re-check `tenantId` on wallet balance updates
- Attachment upload/list/delete APIs pass `tenantId` into R2 helpers after ownership checks

### Removed

- Demo seed script (`pnpm db:seed` / `pnpm db:reset`)
- Seed data module (`src/lib/db/seed-data.ts`) with sample wallets and transactions
- Seed / reset docs from root and app READMEs

### Setup after merge

```bash
vp install
pnpm --filter @vhnam/ledger-box db:migrate
```

`0002_add_wallet_tenant_id` assigns existing wallets to the earliest better-auth user when one exists. Orphan wallets (no users) are deleted.

Optional CSV import into the configured `DATABASE_URL`:

```bash
# ledger-box export format (wallet.csv + transaction.csv)
pnpm --filter @vhnam/ledger-box exec tsx --env-file ../../.env \
  scripts/import-csv.ts /path/to/wallet.csv /path/to/transaction.csv

# bank_accounts / transactions export format
pnpm --filter @vhnam/ledger-box exec tsx --env-file ../../.env \
  scripts/import-bank-csv.ts /path/to/bank_accounts.csv /path/to/transactions.csv
```

If imported `user_id` / `tenant_id` values do not match a better-auth user on that database, remount `wallet.tenant_id` to the signed-in user id so the app can list the wallets.

### Commits

- `f9ca644` feat: support multi-tenant
