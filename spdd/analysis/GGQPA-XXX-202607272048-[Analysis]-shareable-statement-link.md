# SPDD Analysis: Read-Only Shareable Statement Link

## Original Business Requirement

Feature: read-only shareable statement link.

Context — read `AGENTS.md` first. Key constraints from it that this feature must respect:

- Every wallet/transaction handler scopes by `tenant_id` via the helpers in
  `netlify/functions/lib/tenant-access.ts`. Tenancy is v1: one better-auth user = one
  tenant.
- `wallet_member` records invites but does NOT currently grant read access to a wallet.
  This feature must NOT depend on that being fixed.
- Soft deletes on `wallet`, `transaction`, `wallet_member`.
- Migrations are file-based, `000N_description`, next number is `0004`.

Goal: the wallet owner generates a link that lets someone view a statement for one wallet
over one date range, WITHOUT signing in. This exists because the owner holds money on
behalf of other people and needs to show them an account of it.

Requirements to analyse:

- Statement content: opening balance, transactions in the period with a running balance,
  closing balance, total in / total out.
- A link is scoped to one wallet AND one date range. It must not expose transactions
  outside that range, other wallets, attachments, or any user identity.
- Links can be revoked. Revocation takes effect immediately.
- The owner can see which links are currently live.
- Optional expiry.

Analyse and surface, before proposing a design:

- How the public route bypasses the `/_app` session guard without weakening tenant
  scoping elsewhere. The existing app shell redirects unauthenticated users to
  `/auth/login`.
- Token design: shape, entropy, storage, whether it is guessable or enumerable.
- Whether soft-deleted transactions appear in a statement, and how the running balance
  stays internally consistent either way.
- What happens to an already-issued link when a transaction inside its period is later
  edited or deleted — the viewer may have seen different numbers before.
- Whether the statement is computed live or snapshotted at generation time, and the
  trade-off.

Do not produce a REASONS Canvas yet. Output the analysis only.

## Domain Concept Identification

### Existing Concepts (from codebase)

- **Wallet**: Named balance container owned by a `tenant_id`; `wallet.amount` is the current authoritative balance; soft-deleted via `deleted_at`. Related to transactions one-to-many.
- **Transaction**: Income or expense row tied to one wallet; affects `wallet.amount` atomically on create/edit/delete; soft-deleted via `deleted_at`. No categories — description is free text.
- **Tenant (v1)**: Equals better-auth user id. All authenticated wallet/transaction APIs scope through `getTenantId` + `requireOwnedWallet` / `requireOwnedTransaction` in `apps/ledger-box/netlify/functions/lib/tenant-access.ts`.
- **Wallet member**: Invite records with viewer/manager roles — does **not** grant access today; irrelevant to this feature if links are token-based.
- **Date range filtering**: Existing transaction list (`wallet-transactions.mts`) filters by `updated_at` (not `created_at`) within a range; excludes `deleted_at IS NOT NULL`.
- **Period summary (authenticated UI)**: `wallet-summary` aggregates income/expenses/net for the filtered page of transactions (max 100 per request) — **not** opening/closing balance or running balance.
- **Auth boundary**: TanStack Router `/_app` route runs `beforeLoad` session check and redirects to `/auth/login`. `/auth/*` routes are public siblings under the root layout — no session required.
- **API boundary**: All wallet/transaction Netlify handlers call `auth.api.getSession` and return 401 without a session. No public read endpoints exist today.

### New Concepts Required

- **Statement share link**: Opaque, revocable capability granting read-only access to one wallet's statement for one fixed date range. Owned by the wallet owner (tenant); independent of `wallet_member` invites.
- **Statement view**: Derived read model — opening balance, period transactions with running balance, closing balance, total in, total out. Must not include attachments, other wallets, tenant/user identity, or out-of-range transactions.
- **Public statement route**: Frontend page outside `/_app` that renders a statement from a token-only URL (no login).
- **Public statement API**: Backend endpoint that authorizes via token lookup (not session/tenant helpers), returns the minimal statement payload.

### Key Business Rules

- **Provable balances**: Opening + period net must reconcile to closing; running balance must be internally consistent row-by-row (AGENTS.md money rules).
- **Scope isolation**: Link grants exactly one wallet + one date range; no enumeration of wallets, users, or transactions outside the range.
- **Owner-only management**: Creating, listing, and revoking links requires authenticated ownership (`requireOwnedWallet`) — same as other wallet mutations.
- **Immediate revocation**: Revoked (or expired) tokens must fail on the next request with a generic not-found or gone response — no stale data leak.
- **No member dependency**: Viewers do not sign in and do not use `wallet_member` — the link is the authorization mechanism.
- **Soft-delete semantics**: Existing APIs hide soft-deleted transactions from lists; statement must define explicit behavior (see Risk & Gap Analysis).
- **Period date field**: Existing filters use `updated_at`; statement period boundaries must align with this convention or deliberately diverge with documented rationale.

## Strategic Approach

### Solution Direction

Introduce a **capability-token** model (new `0004` migration table) rather than reusing session auth or `wallet_member`. The owner creates a link via authenticated wallet APIs; the system stores a **hashed** random token with `wallet_id`, `from_date`, `to_date`, optional `expires_at`, and `revoked_at`. The public surface is two new paths outside the authenticated shell:

1. **Frontend**: A route sibling to `/auth` (e.g. `/statement/$token`) — **not** under `/_app` — so the session `beforeLoad` guard never runs.
2. **Backend**: A dedicated Netlify function (e.g. `GET /api/public/statements/:token`) that resolves the token, checks revocation/expiry, computes or returns the statement, and never calls `getTenantId`. Existing authenticated handlers remain unchanged.

Owner management (list live links, create, revoke) lives under authenticated wallet-scoped APIs using `requireOwnedWallet`, consistent with members/settings patterns.

### Key Design Decisions

- **Public route placement**: Add `routes/statement/$token.tsx` (or similar) at the root route tree, parallel to `auth/` and `_app/`. Only `/_app/route.tsx` enforces login today (`apps/ledger-box/src/routes/_app/route.tsx`). This bypasses the session guard without modifying it — tenant scoping on existing APIs stays intact because public access never hits those handlers.
  → **Recommendation**: Separate route + separate API; do not add exceptions inside `/_app` or shared transaction handlers.

- **Token shape & storage**: Generate ≥128 bits of entropy (e.g. 32-byte random, base64url-encoded, ~43 chars). Store only a **hash** (SHA-256 of the raw token) in the database; return the raw token once at creation for the owner to copy. URL carries the raw token: `/statement/{token}`. Lookup by hash; index on `token_hash` unique.
  → **Recommendation**: Non-guessable, non-enumerable (no sequential ids in URL). Wallet UUID must not appear in the public URL.

- **Soft-deleted transactions in statements**: Match existing list behavior — **exclude** `deleted_at IS NOT NULL`. Running balance is computed only over included rows; opening balance sums all non-deleted transactions strictly before period start (using the chosen date column). If a transaction is deleted after a link was issued, it drops from a live-computed view (see snapshot trade-off).
  → **Recommendation**: Exclude soft-deleted; document that live views reflect current ledger state.

- **Post-issuance edits/deletes**: Product tension between accountability ("account I showed you") and ledger truth.
  → **Recommendation**: Prefer **snapshot at link creation** for the statement payload (store JSON or normalized rows in the share record). Rationale: the use case is showing someone an account of money held on their behalf — they should see a stable document. Live recompute is simpler but undermines trust if the owner changes history after sharing. If snapshot is rejected for v1 scope, live compute must be explicit: "statement reflects current data; may change if owner edits."

- **Live vs snapshot trade-off**:

  | Approach                       | Pros                                                                                   | Cons                                                                                                                 |
  | ------------------------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
  | **Live compute** on each `GET` | Always matches owner's current ledger; no extra storage; edits propagate automatically | Viewer may see different numbers after owner edit/delete; opening balance can shift; harder to explain discrepancies |
  | **Snapshot at creation**       | Stable account for the beneficiary; matches "here is your statement" intent            | Storage; diverges from live wallet if owner later corrects errors; may need "regenerate link" workflow               |
  | **Snapshot at first view**     | Middle ground                                                                          | First viewer locks content; owner may not have previewed final numbers                                               |

  → **Recommendation**: Snapshot at creation for v1, with optional `generated_at` timestamp shown on the statement. Owner can revoke and create a new link after corrections.

- **Opening/closing balance computation**: No existing server-side logic — must be built. Opening = net of all non-deleted transactions with `updated_at < period_start` (or `created_at` if product chooses — **must decide**). Closing = opening + total in − total out for period rows. Cross-check against `wallet.amount` only for "as of now" sanity, not for historical period closing unless period ends today.
  → **Recommendation**: Server-side computation in the public (or shared) statement service; do not reuse paginated `wallet-transactions` GET as-is (max pageSize 100, no running balance).

- **Date column for period**: Existing filter uses `updated_at`, meaning edits move transactions between periods.
  → **Recommendation**: Align statement period with `updated_at` for consistency with the authenticated UI, and surface this as a product rule. Alternative (`created_at`) is more intuitive for statements but diverges from current app behavior.

### Alternatives Considered

- **Signed JWT in URL (no DB row)**: Stateless token embedding wallet id + range + expiry. Rejected: immediate revocation requires server-side state or blocklists; wallet id in payload increases leak surface if secret rotates.
- **Reuse `wallet_member` viewer role**: Rejected per requirement — members cannot access wallets today; fixing that is a separate tenancy change.
- **Authenticated share via magic login**: Rejected — requirement is view **without** signing in.
- **Expose existing `GET /api/wallets/:id/transactions` with a query param token**: Rejected — couples public access to tenant-scoped handler; high risk of widening other endpoints.

## Risk & Gap Analysis

### Requirement Ambiguities

- **Which timestamp defines period membership?** Codebase filters on `updated_at`; beneficiaries may expect `created_at` (transaction date). Needs product decision before REASONS Canvas.
- **Wallet name on public statement?** Showing the wallet name helps context but may identify the owner or purpose. Requirement says no user identity — clarify whether wallet name is allowed.
- **Transaction descriptions**: May contain PII or counterparty names in free text — still exposed unless redacted. Not mentioned in requirements.
- **Transfer visibility**: Transfers appear as expense/income with `[From] → [To]: note` descriptions — exposes other wallet **names** but not ids or balances. Acceptable?
- **"Live links" definition**: Active = not revoked AND (no expiry OR expiry in future)? Soft-deleted wallet should auto-invalidate all its links — not stated.
- **Optional expiry**: Default when omitted — never expires until revoked? Needs default.
- **Timezone for date ranges**: `date-ranges.ts` uses local server/browser day boundaries; public viewers may be in different zones.

### Edge Cases

- **Wallet soft-deleted after link issued**: Public endpoint should return 404/gone; owner's link list should show revoked or invalid.
- **Transaction edited after snapshot**: Snapshot unchanged; live view would change amount/description and possibly period membership if `updated_at` changes.
- **Transaction soft-deleted after viewer saw it**: Live view removes row and shifts running balance; snapshot preserves it unless snapshot taken after delete.
- **Empty period**: Opening equals closing; zero transactions; still valid statement.
- **Period with >100 transactions**: Current transaction API caps page size at 100; statement must fetch all rows in range (no pagination on public view, or cursor through all pages server-side).
- **Concurrent revocation**: Token valid at read start, revoked before response — acceptable race; next request fails.
- **Owner creates overlapping links**: Same wallet/range allowed? Multiple active tokens — no restriction stated.
- **Balance drift**: `wallet.amount` is live; historical closing balance from transaction sum may not equal current `wallet.amount` if there are transactions outside the period — expected, but must be explained in UI.

### Technical Risks

- **Accidental tenant bypass**: Public handler must not become a template for skipping `requireOwnedWallet` on existing routes. Mitigation: separate function file, no shared "optional auth" middleware.
- **Token leakage via logs/referrers**: HTTPS only; avoid logging full token; `Referrer-Policy` on public page.
- **Enumeration**: Use constant-time hash compare; uniform 404 for invalid/expired/revoked tokens.
- **Rate limiting**: Public endpoint is brute-forceable without throttling — Netlify/CDN rate limits or application-level limits needed for production.
- **Snapshot storage size**: Long periods with many transactions — JSON blob in Postgres acceptable for v1; watch row size.
- **Running balance correctness**: Must use ordered transaction sequence (recommend `updated_at ASC, id ASC` tiebreaker); income adds, expense subtracts — mirror `getTransactionContribution` in `wallet-transaction.mts`.

### Deep-Dive: Questions from the Requirement

#### 1. Public route vs `/_app` session guard

Today only `/_app/route.tsx` enforces login. `__root.tsx` is a passthrough `Outlet`. `/auth/*` is already public. A new `/statement/$token` route (outside `_app`) renders without session. The public page calls only the token-scoped API — never authenticated wallet endpoints. **Tenant scoping elsewhere is unchanged** because `getTenantId` / `requireOwnedWallet` remain mandatory on all existing handlers; the new public handler uses a separate authorization path (token hash → share record → wallet id + date range).

#### 2. Token design

- **Shape**: `base64url(randomBytes(32))` in URL path; no structured payload in the token.
- **Entropy**: 256 bits — not guessable in practice.
- **Storage**: `token_hash` (unique), never store raw token after creation response.
- **Enumerable?**: No — random tokens, not sequential. Internal share `id` (UUID) is only used on authenticated owner APIs, not in public URL.
- **DB table (conceptual)**: `wallet_statement_share` — `id`, `wallet_id`, `tenant_id`, `from_date`, `to_date`, `token_hash`, `expires_at`, `revoked_at`, `created_at`, optional `snapshot_json` / `snapshot_at`.

#### 3. Soft-deleted transactions

**Should not appear** — consistent with `wallet-transactions.mts` (`deleted_at IS NULL`). Running balance computed over visible rows only. If a transaction is deleted mid-period, live statement drops it and recalculates; snapshot keeps pre-delete state unless regenerated.

#### 4. Post-issuance edit/delete

| Mode     | Viewer experience after owner edit/delete                                          |
| -------- | ---------------------------------------------------------------------------------- |
| Live     | Numbers change on refresh; viewer may have screenshot of old data — no audit trail |
| Snapshot | Viewer sees original; owner must revoke and issue new link to share corrections    |

For money held on behalf of others, **snapshot is the safer default**. If live is chosen, UI should state that the statement is not a fixed record.

#### 5. Live vs snapshot

See trade-off table in Strategic Approach. **Recommend snapshot at creation** for v1 given product goal ("show them an account of it"). Live compute is acceptable for MVP only if product explicitly accepts mutable shared views.

### Acceptance Criteria Coverage

| AC# | Description                                                                                              | Addressable? | Gaps/Notes                                                             |
| --- | -------------------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------- |
| 1   | Statement shows opening balance, period transactions with running balance, closing balance, total in/out | Yes          | No server logic exists today; must be built; date column TBD           |
| 2   | Link scoped to one wallet and one date range                                                             | Yes          | New share table + token lookup                                         |
| 3   | Must not expose out-of-range transactions, other wallets, attachments, user identity                     | Yes          | Dedicated minimal DTO; no attachment routes; no session fields         |
| 4   | Links can be revoked; immediate effect                                                                   | Yes          | Set `revoked_at`; check on every public GET                            |
| 5   | Owner can see live links                                                                                 | Yes          | Authenticated `GET /api/wallets/:walletId/statement-shares` (name TBD) |
| 6   | Optional expiry                                                                                          | Yes          | `expires_at` nullable; check alongside revocation                      |
| 7   | Public access without sign-in                                                                            | Yes          | Route outside `/_app` + token API                                      |
| 8   | Does not depend on `wallet_member` fix                                                                   | Yes          | Token auth is orthogonal                                               |
| 9   | Respects tenancy on owner APIs                                                                           | Yes          | `requireOwnedWallet` on create/list/revoke                             |
| 10  | Migration `0004`                                                                                         | Yes          | New table for shares (+ optional snapshot column)                      |

**Open product decisions blocking REASONS Canvas** (recommend resolving first):

1. Snapshot at creation vs live compute?
2. Period boundary on `updated_at` vs `created_at`?
3. Show wallet name on public statement?
4. Default expiry when not set?
5. Behavior when parent wallet is soft-deleted?
