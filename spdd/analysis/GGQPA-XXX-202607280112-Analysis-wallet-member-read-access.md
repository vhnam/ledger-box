# SPDD Analysis: Grant Invited Wallet Members Real Read/Write Access

## Original Business Requirement

Member-visibility gap (from `AGENTS.md`, "Non-negotiable: tenancy scoping" section):

> **Known gap — do not paper over it:** the `wallet_member` table records invites with
> `viewer` / `manager` roles, but member APIs still require wallet ownership via
> `tenant_id`. An invited user signing in will not see the wallet. Do not write code
> that assumes members already have read access. If a task requires real member
> access, say so and stop — that is a tenancy model change, not a feature.

Requesting analysis of what it would take to close this gap: an invited `wallet_member`
(status `active`, role `viewer` or `manager`) should actually be able to see and,
depending on role, act on the wallet they were invited to — not just exist as a row
that the owner can view in a settings screen.

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **Tenant**: In the v1 model, `tenant_id` on `wallet` equals the better-auth user id
  of the wallet's creator. Every ownership check in
  `apps/ledger-box/netlify/functions/lib/tenant-access.ts` (`findOwnedWallet`,
  `requireOwnedWallet`, `requireOwnedTransaction`) is a single-column match:
  `wallet.tenant_id = session.user.id`. There is currently no concept of "a tenant
  with multiple authorized users" anywhere in the query layer.
- **Wallet**: Owns a balance (`amount`), a name, a timezone. One row, one `tenant_id`.
  Has `transaction`, `wallet_member`, and `wallet_statement_share` children.
- **WalletMember**: `wallet_id` + `email` + optional `user_id` (nullable until the
  invited email matches a real better-auth account) + `role` (`viewer` | `manager`) +
  `status` (`pending` | `active`) + soft delete. Created via
  `POST /api/wallets/:walletId/members`, but nothing ever transitions `status` from
  `pending` to `active` — there is no accept-invite flow, and no code path reads
  `wallet_member` at all when authorizing a request. It is currently a write-only,
  display-only record.
- **Transaction**: Belongs to a wallet, scoped only through `wallet.tenant_id` via
  `requireOwnedTransaction`, which itself delegates to `requireOwnedWallet`.
- **Session**: better-auth session, resolved per-request in every Netlify function
  independently (`auth.api.getSession`).

#### New Concepts Required

- **Effective wallet access**: A resolved authorization result for
  `(userId, walletId)` that is `owner` (full read/write, matches today's implicit
  behavior), `manager` (read/write per role semantics still to be defined), `viewer`
  (read-only), or `none`. This is the concept that must replace the current binary
  "is the tenant" check everywhere. It does not exist today even conceptually — the
  codebase has no notion of "authorized but not owner."
- **Invite acceptance**: The transition of a `wallet_member` row from `pending` to
  `active`, presumably gated on the invited user signing in with the matching email
  (`user_id` gets backfilled at invite time in `wallet-members.mts:118,126` when the
  email already matches an account, but there is no explicit acceptance step or UI for
  a user who registers _after_ being invited, or who wants to decline).
- **Role-scoped write permission**: What a `manager` is allowed to do that a `viewer`
  is not. The requirement only says "viewer / manager" as labels; nothing in the
  codebase defines the behavioral difference. This needs a business decision, not just
  a code change.

#### Key Business Rules

- **Balance provability** (from `AGENTS.md`): whatever access model is chosen, it must
  not create a path where two authorized users can race a balance-affecting write and
  leave `wallet.amount` inconsistent with its transaction history. This governs
  Transaction and WalletMember jointly.
- **Tenant scoping is non-negotiable**: every handler touching `wallet`, `transaction`,
  or `wallet_member` must still scope by an authorization predicate — the rule doesn't
  go away, its predicate just needs to widen from "tenant_id equality" to "effective
  wallet access includes this user." This governs all four Netlify function families
  (`wallets`, `wallet`, `wallet-members`/`wallet-member`, transactions, attachments,
  statement-shares, summary).
- **Soft delete / never hard-delete** `wallet`, `transaction`, `wallet_member`:
  unaffected by this change but constrains how "remove a member" and "revoke access"
  are implemented (already soft-delete today).
- **R2 tenant-scoped keys** (`tenants/{tenantId}/...`): implicitly assumes one
  "owning" tenant id per wallet for object storage paths. If members can upload
  attachments, this key scheme still resolves through `wallet_id`, not
  `session.user.id`, so it is likely unaffected — but should be verified in the next
  phase since it's a boundary concept touched by write access.

## Strategic Approach

#### Solution Direction

Replace the single-column `tenant_id` equality check inside
`requireOwnedWallet`/`findOwnedWallet` with a lookup that also matches active
`wallet_member` rows for the current user, returning an effective role
(`owner`/`manager`/`viewer`) alongside the wallet. Every Netlify function that
currently calls `requireOwnedWallet` (`wallet.mts`, `wallets.mts`,
`wallet-member(s).mts`, transaction/attachment/summary/statement-share handlers) would
consume that role to decide whether the requested operation (read vs. mutate) is
permitted, instead of only checking existence. This keeps the "helpers in
`tenant-access.ts` are the single choke point" convention already established in
`AGENTS.md` — the fix is concentrated in one file's contract, not scattered across
every handler.

The `GET /api/wallets` list endpoint needs a parallel change: it currently selects
`wallet.tenant_id = tenantId` directly (`wallets.mts:18-24`), so an invited member
would still never see the wallet in their list even if per-wallet checks were fixed.
This is a second query, not just the ownership helper, and must be updated in the same
change or the fix is incomplete.

#### Key Design Decisions

- **Where "effective access" is computed** — inside `tenant-access.ts` (single query,
  e.g. `wallet` LEFT JOIN `wallet_member` on `user_id = tenantId AND status = 'active'`)
  vs. a new dedicated module. → Recommend extending `tenant-access.ts`: it's already
  the documented, mandatory choke point per `AGENTS.md`, and splitting authorization
  logic elsewhere would create a second place to remember.
- **Manager vs. viewer permission boundary** — Define explicitly (e.g. viewer = GET
  only across all wallet-scoped routes; manager = everything except delete-wallet and
  member management) vs. leave ambiguous. → This is a product decision that blocks
  implementation; it should be resolved as an explicit acceptance criterion before
  REASONS Canvas, not inferred from the two role names.
- **Invite acceptance flow** — Auto-activate (`status: 'active'`) the moment
  `user_id` resolves to a real account at invite time, vs. require an explicit
  accept/decline step by the invited user. → The current invite endpoint already
  writes `status: 'pending'` unconditionally even when `user_id` is resolved
  (`wallet-members.mts:129`), so _some_ activation step is required regardless of
  which direction is chosen — this is in scope no matter what.
- **`tenant_id` semantics going forward** — Keep `wallet.tenant_id` meaning "owner"
  (simplest, least migration risk) vs. introduce a separate multi-tenant membership
  model where `tenant_id` is deprecated in favor of an explicit owner role in
  `wallet_member`. → Recommend keeping `tenant_id` as "owner," since `wallet_member`
  already models everyone else; this avoids a schema migration on `wallet` itself and
  keeps the blast radius to the authorization query layer plus the two role-check
  additions to handlers.

#### Alternatives Considered

- **Client-side filtering only** (let the invited user's UI call the API and hide
  errors gracefully): rejected — the current API returns 404 "Wallet not found" for
  non-owned wallets, so there's no data to filter; the block is server-side and
  absolute.
- **Duplicate the ownership check logic per-handler with a `wallet_member` join
  inline**: rejected in favor of centralizing in `tenant-access.ts`, consistent with
  the existing "never query wallet/transaction without going through the shared
  helper" convention.

## Risk & Gap Analysis

#### Requirement Ambiguities

- What exactly can a `manager` do that a `viewer` cannot? Not defined anywhere in
  code, migrations, or `AGENTS.md`.
- Should a `manager` be allowed to invite/remove other members, or is that
  owner-only? Not specified.
- Does an invited `viewer`/`manager` see all wallet history retroactively, or only
  going forward from acceptance? Not specified — likely "all," since there's no
  time-scoping concept in `transaction`, but should be confirmed.
- Should the wallet owner be revocable/demotable, or is ownership permanently fixed to
  the creator's `tenant_id`? Not addressed by the requirement.

#### Edge Cases

- **Invite predates registration**: `findUserByEmail` at invite time may find nobody,
  leaving `user_id` null (`wallet-members.mts:118,126`). When that person later
  registers with better-auth, nothing currently links their new `user_id` back to the
  pending `wallet_member` row — this linkage must be part of the fix or invited users
  who register after being invited will never gain access even under the new model.
- **Email case/whitelisting**: invite uniqueness is enforced via
  `lower(email)` (migration `0003`), but matching a session's user back to a
  `wallet_member` row must use the same case-insensitive comparison consistently.
  When `user_id` is already populated, matching by user_id is unambiguous. When only
  email is populated, an authorization check by session email must also apply
  `lower()`.
- **Owner removes themselves as a "member"**: `wallet-members.mts:102-104` blocks
  inviting the owner's own email as a member, so no conflict there — but confirm the
  new effective-access lookup still returns `owner` (not `none`) for the wallet
  creator in all code paths, including after this query changes shape.
- **Race between invite-role-update and an in-flight request**: if a manager's role is
  downgraded to viewer mid-session, does the change take effect on next request
  (stateless per-request lookup, which is what centralizing in `tenant-access.ts`
  naturally gives) — recommend confirming this is acceptable (it should be, since
  there's no session-cached role today).
- **Attachments/R2 paths and statement shares**: both are reached through
  `requireOwnedWallet`/`requireOwnedTransaction` today; once those helpers accept
  members, attachment upload/delete and statement-share creation become reachable by
  managers/viewers too, which may not be intended — needs explicit scope decision on
  which of the ~12 documented API routes get member access and at what role level.

#/#### Technical Risks

- **Balance-write concurrency**: if `manager` role includes transaction create/edit/
  delete, two users (owner + manager) could submit conflicting transaction writes
  concurrently. Current code already lacks explicit locking beyond
  `db.transaction().execute(...)` wrapping delete-wallet; the same pattern should be
  reused for any new balance-mutating paths reachable by members, but is worth an
  explicit callout since `AGENTS.md` treats balance correctness as a "serious bug"
  category, not a normal defect.
- **Query cost of the new lookup**: turning a single-column equality check into an
  owner-or-active-member join touches every wallet-scoped request (list, get,
  transactions, attachments, summary, statement-shares). Low absolute risk given
  current scale, but worth indexing `wallet_member (user_id, status)` alongside the
  existing `wallet_member_wallet_id_index`.
- **No test coverage on `apps/ledger-box`**: this repo currently has zero test files
  under `apps/ledger-box/src` (confirmed via repo scan) and no CI workflow. An
  authorization-boundary change — the highest-risk category of bug (cross-tenant data
  leak) — would ship with no automated regression protection unless tests are added
  as part of this work.
- **Migration is additive, not destructive**: no existing migration needs editing
  (per `AGENTS.md`, merged migrations are never edited); any schema change (e.g. an
  index, or a `wallet_member` → user linkage backfill column) would be a new
  `000N_*` migration, consistent with existing convention.

#### Acceptance Criteria Coverage

No formal acceptance criteria were supplied — the "requirement" is a flagged gap, not
a written spec. The table below maps the gap's stated conditions instead.

| AC# | Description                                                                   | Addressable? | Gaps/Notes                                                                                                                               |
| --- | ----------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | An invited user with `status: active` can see the wallet they were invited to | Partial      | Requires both `requireOwnedWallet` and the `GET /api/wallets` list query to recognize `wallet_member`; role-boundary decision still open |
| 2   | A `viewer` can read but not mutate wallet/transaction/attachment data         | No           | Read/write boundary per role is undefined — needs a product decision before implementation                                               |
| 3   | A `manager` can perform some superset of viewer actions                       | No           | Superset scope is undefined — needs a product decision before implementation                                                             |
| 4   | Pending invites become active access                                          | No           | No acceptance/activation flow exists; invite endpoint always writes `pending` even when `user_id` resolves immediately                   |
| 5   | Users who register after being invited still gain access                      | No           | No mechanism links a newly-created better-auth account back to a pre-existing `wallet_member.email` row                                  |
