# MR 11 — Wallet Member Read/Write Access

**Branch:** `feat/ui-testing` → `main`

### Added

#### Role-scoped wallet member access

- `tenant-access.ts`: `requireWalletAccess`, `requireWalletWriteAccess`,
  `requireTransactionAccess`, `requireTransactionWriteAccess`,
  `findAccessibleWallets` — resolve `owner` / `manager` / `viewer` access for a
  session against a wallet, in addition to the existing owner-only
  `requireOwnedWallet` / `requireOwnedTransaction` (unchanged, still used by member
  and statement-share management)
- Pending `wallet_member` invites auto-activate the moment a matching session is
  seen — matched by `user_id`, or by case-insensitive email with `user_id` backfill
  for users who register after being invited
- `viewer` gets read-only access to wallets, transactions, attachments, and summary;
  `manager` gets the same access as `owner` except deleting the wallet or managing
  members/statement-shares, which stay owner-only
- Migration `0006_add_wallet_member_user_lookup_index` — `wallet_member (user_id, status)`
  index backing the new membership lookups
- Vitest project for `apps/ledger-box` (previously untested) —
  `vitest.config.ts` / `vitest.setup.ts`, wired into root `test.projects`;
  `netlify/functions/lib/tenant-access.test.ts` covers owner/manager/viewer access,
  pending-invite auto-activation, non-member 404 anti-enumeration, and case-insensitive
  email matching, run against a real local Postgres

### Changed

- `wallets.mts` (`GET`), `wallet.mts` (`PATCH`), `wallet-transactions.mts`,
  `wallet-transaction.mts`, `wallet-transfer.mts`,
  `wallet-transaction-attachments.mts`, `wallet-transaction-attachment.mts`,
  `wallet-summary.mts` — now resolve access via the new role-aware helpers instead
  of owner-only `requireOwnedWallet` / `requireOwnedTransaction`
- Wallet-balance update queries (`wallet.mts`, `wallet-transactions.mts`,
  `wallet-transaction.mts`, `wallet-transfer.mts`) drop the redundant
  `.where('tenantId', '=', tenantId)` predicate — access is already verified before
  the write, and the old predicate would have silently no-op'd every
  manager-triggered balance update, since a manager's own `tenantId` never equals
  the wallet's owning `tenantId`
- Attachment R2 object keys (`uploadTransactionAttachment`,
  `listTransactionAttachments`, `deleteTransactionAttachment`) are now built from the
  wallet's owning `tenantId`, not the acting session's `tenantId` — previously latent
  since only owners could reach these routes; a manager's upload would otherwise have
  landed under a different key prefix than the owner lists from

### Setup after merge

```bash
vp install
pnpm --filter @vhnam/ledger-box db:migrate   # applies migration 0006
vp test                                       # includes new ledger-box Vitest project
```

No new environment variables.

### Commits

- (pending — not yet committed)
