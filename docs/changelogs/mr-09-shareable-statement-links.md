# MR 09 — Shareable Statement Links

**Branch:** `feat/share-link` → `main`

**Depends on:** MR 08 (`occurred_at`, `wallet.timezone`, statement builder)

### Added

#### Schema & migrations

- Migration `0005_create_wallet_statement_share` — `wallet_statement_share` table with period bounds, hashed token, optional `display_title`, `expires_at` / `revoked_at`, frozen `snapshot_json` / `snapshot_at`, and access/rate-limit counters

#### Share token & APIs

- `#/lib/share-token.ts` — 32-byte CSPRNG token generation and SHA-256 hashing
- `GET` / `POST` `/api/wallets/:walletId/statement-shares` — list active shares; create link or preview snapshot (`?preview=true`)
- `DELETE` `/api/wallets/:walletId/statement-shares/:shareId` — revoke a share link
- `GET /api/public/statements/:token` — unauthenticated snapshot read with distinct 404/410 messages, wallet soft-delete check, and 60 req/min rate limit per link

#### Wallet settings UI

- **Statement links** section on wallet settings — list shares, create flow with mandatory preview, optional display title, copy link, revoke
- React Query layer: `useStatementShares`, preview/create/revoke mutations

#### Public statement page

- Route `/statement/$token` (outside `/_app` auth guard) — read-only statement view with period, timezone label, opening/closing balances, and transaction table with running balance
- `StatementSnapshotView` shared between settings preview and public page
- `Referrer-Policy: no-referrer` header for `/statement/*` in `netlify.toml`

#### Shared utilities

- `#/lib/api-error.ts` — `getApiErrorMessage` helper (used by wallet, member, transaction, and statement-share API clients)

#### Schemas & documentation

- `statement-share.schema.ts` — create-share validation (`periodFrom`, `periodTo`, optional `displayTitle`, optional `expiresAt`)
- Decision record: `docs/decisions/share-link.md`
- SPDD analysis and implementation prompt for share links and prerequisites

### Changed

- Wallet settings page includes Statement links card
- `AGENTS.md` — documents statement-share and public statement API routes

### Setup after merge

```bash
vp install
pnpm --filter @vhnam/ledger-box db:migrate
```

Requires migration `0005` (and `0004` from MR 08). No new environment variables.

### Commits

- `a2e72f9` feat(ledger-box): add shareable statement links
