# Grant Active Wallet Members Real Read/Write Access

## Requirements

Extend wallet authorization so that an invited `wallet_member` — not just the wallet's
owning tenant — can access the wallet they were invited to, at a permission level
determined by their role: `viewer` gets read-only access to core wallet data,
`manager` gets full read/write access short of deleting the wallet or managing
members. Auto-activate a pending invite the moment a signed-in session's identity
matches it, so invited users gain access without a separate accept step, whether they
already had an account at invite time or register afterward.

## Entities

```mermaid
classDiagram
direction TB

class Wallet {
  +string id
  +string tenantId
  +string name
  +number amount
  +string timezone
}

class WalletMember {
  +string id
  +string walletId
  +string email
  +string userId
  +WalletMemberRole role
  +WalletMemberStatus status
  +Date deletedAt
}

class EffectiveWalletAccess {
  +Wallet wallet
  +WalletAccessRole role
  +activateIfPending() void
}

class WalletAccessRole {
  <<enumeration>>
  OWNER
  MANAGER
  VIEWER
}

class Session {
  +string userId
  +string email
}

class AccessDeniedResult {
  +false ok
  +Response error
}

class AccessGrantedResult {
  +true ok
  +Wallet wallet
  +WalletAccessRole role
}

Wallet "1" -- "0..*" WalletMember : has invited members
Session --> EffectiveWalletAccess : resolves via requireWalletAccess
EffectiveWalletAccess --> WalletAccessRole : carries
EffectiveWalletAccess --> AccessGrantedResult : maps to (ok)
EffectiveWalletAccess --> AccessDeniedResult : maps to (not found/none)
WalletMember --> WalletAccessRole : role column maps 1:1 (manager/viewer)
```

## Approach

1. **Authorization strategy**:
   - Widen the existing single-column ownership check into a role-resolving lookup,
     kept inside the same choke-point file (`tenant-access.ts`) that `AGENTS.md`
     already documents as mandatory for every handler touching `wallet`,
     `transaction`, or `wallet_member`.
   - The lookup returns an `EffectiveWalletAccess` result: `owner` (unchanged
     behavior, `wallet.tenant_id = session user`), `manager`/`viewer` (active
     `wallet_member` row matched by `user_id` or, when `user_id` is null, by
     case-insensitive email), or denial (404, same as today — never leak wallet
     existence to unauthorized users).
   - Auto-activation happens inside the same lookup: if a matching `wallet_member`
     row is found with `status = 'pending'`, flip it to `active` (and backfill
     `user_id` if it was null) as part of resolving access for that request, so
     "invited before registering" and "invited after registering" both converge on
     one code path.

2. **Technical implementation**:
   - Kysely query builder, consistent with the rest of the data layer — no ORM, no
     raw string SQL beyond the existing `sql` tag usage already present in
     `wallet-members.mts`.
   - New handlers reuse the existing per-handler pattern: resolve session →
     resolve access → branch on `request.method` and `role`. No new framework or
     library introduced.
   - Every handler that currently denies with `404 Wallet not found` on ownership
     failure keeps that exact status/message for `role: 'none'`, so unauthorized
     probing still can't distinguish "wallet doesn't exist" from "wallet exists but
     you can't see it."
   - Write-attempting requests from a `viewer` get `403 Forbidden`, not `404` —
     existence is already confirmed at that point, only the operation is denied.

3. **Business logic**:
   - Core rule: role is resolved fresh on every request (no session-cached role),
     so a role downgrade takes effect on the invited user's very next call.
   - Scope for this change: `wallets` (list, get), `wallet` (get/rename only — no
     delete for non-owners), `wallet-transactions`/`wallet-transaction`,
     `wallet-transaction-attachments`/`wallet-transaction-attachment`,
     `wallet-summary`. Member management (`wallet-members`/`wallet-member`) and
     statement-share management (`wallet-statement-shares`/`wallet-statement-share`)
     stay owner-only in this change — out of scope per the agreed route boundary.
   - Balance-affecting writes (create/edit/delete transaction, transfer) remain
     wrapped in `db.transaction().execute(...)` exactly as today; manager access
     does not change the atomicity guarantee, it only changes who is allowed to
     trigger it.

## Structure

### Inheritance Relationships

1. `EffectiveWalletAccess` is a discriminated union: `{ ok: true; wallet; role }` |
   `{ ok: false; error: Response }` — same shape convention as the existing
   `requireOwnedWallet` return type, extended with a `role` field on the success
   branch.
2. No new classes or exception hierarchy — Netlify function handlers return `Response`
   objects directly, consistent with every existing handler in
   `apps/ledger-box/netlify/functions/`.

### Dependencies

1. `wallets.mts`, `wallet.mts`, `wallet-transactions.mts`, `wallet-transaction.mts`,
   `wallet-transaction-attachments.mts`, `wallet-transaction-attachment.mts`,
   `wallet-summary.mts` call the new `requireWalletAccess` (and, where a specific
   write permission must be checked, a new `requireWalletWriteAccess`) in
   `tenant-access.ts` instead of `requireOwnedWallet`/`requireOwnedTransaction`.
2. `tenant-access.ts` depends on `db` (`#/lib/db/index.ts`) and the `WalletMemberRole`/
   `WalletMemberStatus` types from `#/lib/db/schema.ts`.
3. `wallet-members.mts`, `wallet-member.mts`, `wallet-statement-shares.mts`,
   `wallet-statement-share.mts` are unchanged — they keep calling
   `requireOwnedWallet` (owner-only), which remains as-is for backward compatibility.
4. `wallets.mts` GET (list) additionally depends on a new list query that unions
   owned wallets with wallets the tenant has active membership in — this cannot go
   through `requireWalletAccess` (which operates on one walletId) and needs its own
   function, `findAccessibleWallets`, in `tenant-access.ts`.

### Layered Architecture

1. Netlify Function Layer: Parses request, resolves session, calls the access helper,
   branches on `role` for method-specific permission checks, shapes the `Response`.
2. Access Resolution Layer (`tenant-access.ts`): Single source of truth for "can this
   session act on this wallet, and how" — owns the owner/member/none resolution and
   the pending→active auto-activation side effect.
3. Data Access Layer: Kysely queries against `wallet`, `walletMember`, `transaction`
   tables — no change to existing query patterns, only to which predicate gates them.
4. No global exception handler exists or is introduced — each handler returns typed
   `Response` errors inline, matching the codebase's existing convention (confirmed:
   there is no centralized error-handling layer in this codebase, unlike typical
   Spring-style stacks).

## Operations

### Update Module - `tenant-access.ts`

1. Responsibility: Resolve effective access (owner/manager/viewer/none) for a
   `(tenantId, walletId)` pair, including auto-activating a matching pending invite,
   and expose write-permission checks derived from that role.

2. New/changed exports:

   - `type WalletAccessRole = 'owner' | 'manager' | 'viewer'`
   - `type WalletAccessResult = { ok: true; wallet: OwnedWallet; role: WalletAccessRole } | { ok: false; error: Response }`

   - `requireWalletAccess(tenantId: string, walletId: string, sessionEmail: string): Promise<WalletAccessResult>`
     - Logic:
       - Query `wallet` by `id = walletId AND deleted_at IS NULL`. If not found →
         `{ ok: false, error: 404 'Wallet not found' }`.
       - If `wallet.tenant_id === tenantId` → return `{ ok: true, wallet, role: 'owner' }`.
       - Else query `walletMember` for a row matching `wallet_id = walletId AND deleted_at IS NULL AND (user_id = tenantId OR (user_id IS NULL AND lower(email) = lower(sessionEmail)))`.
       - If no row found → `{ ok: false, error: 404 'Wallet not found' }` (do not
         reveal existence to unrelated users).
       - If row found with `status = 'pending'`: update it in the same request —
         set `status = 'active'`, `user_id = tenantId` (if null), `updated_at = now()`
         — then proceed as active.
       - Return `{ ok: true, wallet, role: row.role }` (`'manager'` or `'viewer'`).
     - Error handling: any DB error propagates as an unhandled rejection, consistent
       with existing handlers (no new try/catch pattern introduced).

   - `requireWalletWriteAccess(tenantId: string, walletId: string, sessionEmail: string): Promise<WalletAccessResult>`
     - Logic:
       - Delegate to `requireWalletAccess`.
       - If resolved role is `'viewer'` → return `{ ok: false, error: 403 'Read-only access' }`.
       - Otherwise return the result unchanged (`owner` or `manager` both pass).

   - `findAccessibleWallets(tenantId: string, sessionEmail: string): Promise<OwnedWallet[]>`
     - Logic:
       - Select wallets where `tenant_id = tenantId AND deleted_at IS NULL`
         UNION
         wallets joined to `walletMember` where `wallet_member.deleted_at IS NULL`
         AND (`user_id = tenantId` OR (`user_id IS NULL AND lower(email) = lower(sessionEmail)`))
         AND `wallet_member.status IN ('active', 'pending')` — include pending rows
         here too since listing triggers the same auto-activation semantics as
         opening the wallet; simplest to activate lazily only when a specific wallet
         is opened via `requireWalletAccess`, and just include pending in the list
         query so it's visible before the user clicks in.
       - Order by `name` (matches current `wallets.mts:23` behavior).
     - Note: does not perform activation — activation only happens through
       `requireWalletAccess` when a specific wallet is actually accessed, keeping the
       list endpoint a pure read.

   - Keep `findOwnedWallet`, `requireOwnedWallet`, `requireOwnedTransaction`,
     `getTenantId` unchanged and exported — `wallet-members.mts`, `wallet-member.mts`,
     `wallet-statement-shares.mts`, `wallet-statement-share.mts` continue using them
     unmodified (owner-only scope, out of change).

   - `requireTransactionAccess(tenantId: string, walletId: string, transactionId: string, sessionEmail: string): Promise<TransactionAccessResult>`
     - Logic: delegates to `requireWalletAccess` for the wallet-level role, then loads
       the transaction scoped to `walletId` (`404 'Transaction not found'` if missing),
       returning `{ ok: true, wallet, role, transaction }`. Named explicitly (the
       original approach only implied "a transaction-equivalent" of
       `requireWalletAccess" — this is that function).

   - `requireTransactionWriteAccess(tenantId: string, walletId: string, transactionId: string, sessionEmail: string): Promise<TransactionAccessResult>`
     - Logic: delegates to `requireTransactionAccess`, then denies with `403 'Read-only access'` if the resolved role is `'viewer'`, same pattern as `requireWalletWriteAccess`.

   - `OwnedWallet` gained a `tenantId` field (previously only `id`/`name`/`amount`/`timezone`)
     so callers can recover the wallet's owning tenant after access has been resolved
     via membership rather than direct ownership — needed by the R2 key-scoping fix
     below.

3. Constraints:
   - `requireWalletAccess`/`requireWalletWriteAccess` must never distinguish
     "wallet doesn't exist" from "wallet exists but you have no access" in their
     error response — both are `404 'Wallet not found'`.
   - Email comparison must always be case-insensitive (`lower()`), matching the
     existing unique-index convention in migration `0003`.

### Update Handler - `wallets.mts` (`GET /api/wallets`)

1. Replace the direct `db.selectFrom('wallet').where('tenantId', '=', tenantId)...`
   query with `findAccessibleWallets(tenantId, session.user.email)`.
2. `POST /api/wallets` (create) is unchanged — creation always makes the caller the
   owner; membership is irrelevant here.

### Update Handler - `wallet.mts` (`PATCH`/`DELETE /api/wallets/:walletId`)

1. Resolved: no dedicated `GET` route was added. `fetchWallet` in
   `src/queries/wallets/wallet.api.ts` derives a single wallet from the
   `GET /api/wallets` list response — that list already goes through
   `findAccessibleWallets`, so members resolve wallet metadata through the same path
   as owners with no new route needed.
2. `PATCH` (rename): replace `requireOwnedWallet` with `requireWalletWriteAccess`.
   Manager can rename; viewer gets 403. The rename query's `.where("tenantId", "=", tenantId)`
   predicate was dropped (kept only `.where("id", "=", walletId)`), since a manager's
   `tenantId` never equals the wallet's owning `tenantId` — access was already verified
   by `requireWalletWriteAccess`, so the extra predicate only served to silently block
   managers.
3. `DELETE`: keep `requireOwnedWallet` (owner-only) — deleting the wallet is
   explicitly excluded from manager permissions per the agreed role boundary.

### Update Handlers - `wallet-transactions.mts`, `wallet-transaction.mts`

1. `GET` (list/get transactions): replace `requireOwnedWallet`/`requireOwnedTransaction`
   with `requireWalletAccess`/`requireTransactionAccess` — owner, manager, and viewer
   all pass.
2. `POST`/`PATCH`/`DELETE` (create/edit/delete transaction): replace with
   `requireWalletWriteAccess`/`requireTransactionWriteAccess` — owner and manager pass,
   viewer gets 403. Balance-reversal-on-edit math is unchanged, but every wallet-balance
   update's `.where("tenantId", "=", tenantId)` predicate was dropped to
   `.where("id", "=", walletId)` only — access is already verified upstream, and the
   tenantId predicate would have made manager-triggered balance updates silently
   affect zero rows.
3. `wallet-transfer.mts` (`POST /api/wallets/transfer`): both legs now resolve through
   `requireWalletWriteAccess(tenantId, legWalletId, session.user.email)` instead of a
   single `db.selectFrom('wallet').where('tenantId', '=', tenantId)` query for both
   wallets — the source wallet's check now also accepts a manager of that wallet, not
   only its owner. Both legs' balance-update predicates dropped `tenantId` for the same
   reason as above.

### Update Handlers - `wallet-transaction-attachments.mts`, `wallet-transaction-attachment.mts`

1. `GET`/list: `requireTransactionAccess` (owner/manager/viewer).
2. `POST` (upload)/`DELETE` (permanent R2 delete): `requireTransactionWriteAccess`
   (owner/manager only).
3. Resolved: R2 key scheme (`tenants/{tenantId}/...`) must use the wallet's owning
   `tenantId` (`access.wallet.tenantId`), not the acting session's `tenantId` — the
   prior code passed the acting user's own `tenantId` into
   `uploadTransactionAttachment`/`listTransactionAttachments`/`deleteTransactionAttachment`,
   which was already latently wrong (irrelevant while only owners could reach these
   routes, since owner's own tenantId happened to be the only tenantId in play) and
   would have caused a manager's upload to land under a different object-key prefix
   than the owner lists from. Fixed by threading `access.wallet.tenantId` through all
   three R2 calls instead of `getTenantId(session)`.

### Update Handler - `wallet-summary.mts`

1. Replace `requireOwnedWallet` with `requireWalletAccess` — read-only endpoint, all
   three roles pass.

### No Change - `wallet-members.mts`, `wallet-member.mts`, `wallet-statement-shares.mts`, `wallet-statement-share.mts`

1. Continue using `requireOwnedWallet` unmodified — member management and
   statement-share management remain owner-only per the agreed route scope. Do not
   widen these in this change.

### Create Migration - `0006_add_wallet_member_user_lookup_index`

1. Responsibility: support the new `walletMember` lookup predicate efficiently.
2. Add index: `wallet_member (user_id, status) where deleted_at is null` — the
   existing `wallet_member_wallet_id_index` covers the `wallet_id` side; this new
   index covers the `user_id`-driven reverse lookup used by `findAccessibleWallets`
   and `requireWalletAccess`.
3. Follows existing migration convention: new file, never edit `0003_create_wallet_member.ts`.
   Applied to the local dev database via `pnpm --filter @vhnam/ledger-box db:migrate`.

### Create Test Infrastructure - `apps/ledger-box` Vitest project

1. Responsibility: resolve the Norms section's testing gap with a concrete setup,
   since `apps/ledger-box` had zero test files and no wired test runner before this
   change.
2. `apps/ledger-box/vitest.config.ts`: Node-environment Vitest project named
   `ledger-box`, registered in root `vite.config.ts`'s `test.projects` alongside the
   existing `apps/storybook/vitest.config.ts` entry.
3. `apps/ledger-box/vitest.setup.ts`: loads `DATABASE_URL` (and any other root `.env`
   values) into `process.env` before tests run, since `db`'s connection pool
   (`src/lib/db/pool.ts`) reads `process.env.DATABASE_URL` directly and Vitest doesn't
   load the monorepo-root `.env` on its own.
4. `apps/ledger-box/netlify/functions/lib/tenant-access.test.ts`: integration tests
   against the real local Postgres (not mocked) — creates and tears down real
   `wallet`/`walletMember`/`transaction` rows per test. Covers: owner access, active
   manager access (read + write), active viewer access (read allowed, write 403),
   pending-invite auto-activation matched by `user_id`, pending-invite auto-activation
   matched by case-insensitive email with `user_id` backfill (the
   registers-after-being-invited case), 404 anti-enumeration for non-members
   (indistinguishable from a missing wallet), and `findAccessibleWallets` list
   membership (owner + active/pending member, excluding unrelated users).
5. `pnpm test` script added to `apps/ledger-box/package.json` (`vitest run`).

## Norms

1. **Handler pattern**: every updated handler keeps the existing shape — resolve
   session → resolve access via the shared helper → branch on `request.method` →
   return a typed `Response`. Do not introduce per-handler inline ownership queries.
2. **Dependency injection**: none — this codebase calls the shared `db` singleton
   directly from `#/lib/db/index.ts`, consistent with every existing handler and
   helper.
3. **Error handling**:
   - No custom exception classes or global exception handler exist in this codebase;
     do not introduce one. Errors are returned as `Response` objects with a status
     code and plain-text or JSON body, matching every existing handler.
   - `404 'Wallet not found'` for "no access" (existence-hiding, matches current
     behavior exactly).
   - `403` with a short plain-text reason for "access exists but insufficient role"
     (new status code introduced by this change — first use of 403 in this codebase;
     grep confirmed no existing 403 usage, so match the plain-text `Response`
     convention used by existing 404/400/401/405 responses).
4. **Imports**: use `#/` alias, never `@/` or long relative paths, per `AGENTS.md`.
5. **Naming**: new exports follow existing camelCase convention in `tenant-access.ts`
   (`requireOwnedWallet` → `requireWalletAccess`, `requireWalletWriteAccess`,
   `findAccessibleWallets`).
6. **Testing**: resolved — a Node-environment Vitest project was added for
   `apps/ledger-box` (see "Create Test Infrastructure" in Operations), run via
   `pnpm test` in that package or `vp test --project ledger-box` from the root. Tests
   are integration-style against the real local Postgres, not mocked, matching how
   the rest of the data layer (Kysely against a live pool) is exercised in this
   codebase. Covers owner access, active manager access, active viewer access (read
   allowed, write 403), pending-invite auto-activation (both user-id and email-match
   paths), non-member denial (404), and case-insensitive email matching.

## Safeguards

1. **Functional constraints**:
   - A `viewer` must never succeed on any mutating request (`POST`/`PATCH`/`DELETE`)
     across the in-scope routes — verified by returning `403`, not by client-side
     hiding.
   - Member management (`wallet-members`, `wallet-member`) and statement-share
     management routes must remain owner-only in this change — do not widen their
     access checks.
   - Wallet deletion (`DELETE /api/wallets/:walletId`) must remain owner-only.
2. **Performance constraints**: the new `wallet_member` lookup must be covered by an
   index (`user_id, status`) so per-request authorization stays a single indexed
   lookup, not a sequential scan, at current and near-term data volumes.
3. **Security constraints**:
   - Unauthorized and non-existent wallets must be indistinguishable to the caller
     (both `404`), preserving the existing anti-enumeration behavior.
   - Auto-activation must only ever match on the _session's own_ identity
     (`tenantId`/`sessionEmail` from the authenticated session) — never accept a
     walletId/email pair from request body/query to activate a different account's
     invite.
   - R2 object key scoping must be verified unchanged before this ships — members
     must not gain access to attachments outside their wallet's existing key prefix.
4. **Integration constraints**: no API route signatures (paths, methods, request/
   response shapes) change for existing owner-only flows — this is purely an
   authorization-predicate widening, not a contract change, so existing frontend
   query/mutation code in `src/queries/wallets/*` continues to work unmodified for
   owners.
5. **Business rule constraints**:
   - Balance atomicity (`AGENTS.md` "money rules") must hold identically regardless
     of whether the acting user is an owner or a manager — no new balance-mutation
     code path is introduced, only new callers of the existing atomic paths.
   - Soft-delete semantics for `wallet`, `transaction`, `wallet_member` are unchanged.
6. **Technical constraints**:
   - No ORM, no raw string SQL beyond existing `sql` tag usage — Kysely query builder
     only.
   - No new migration may edit `0001`–`0005` — only additive new migration files.
7. **Data constraints**:
   - `walletMember` role/status check constraints (`role in ('viewer','manager')`,
     `status in ('active','pending')`) are unchanged; auto-activation only ever
     writes `status = 'active'`, never introduces a new status value.
8. **API constraints**:
   - New `403` responses use plain-text bodies, matching the existing convention for
     `400`/`401`/`404`/`405` in this codebase — do not introduce a JSON error-envelope
     format inconsistent with the rest of the API.
   - `GET /api/wallets` response shape (`{ id, name, amount }[]`) is unchanged; only
     the row-selection predicate changes.
