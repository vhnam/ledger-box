# SPDD Analysis: Wallet Activity Log

## Original Business Requirement

Feature: wallet activity log.

Read `AGENTS.md` for tenancy, soft-delete, and money-handling rules.

Why now: MR 11 gave `manager` role write access to wallets, transactions, and
attachments. Before that, only the owner could change anything, so "who changed this"
had one answer. Now a wallet balance can change without the owner knowing who caused it.
This product holds money on behalf of other people — the owner must be able to account
for every change.

Scope to analyse:

- An append-only log of actions on a wallet: transaction create/edit/delete, transfer,
  wallet rename/delete, member invite/role change/removal, statement-share create/revoke.
- What each entry records: actor (session user), wallet, entity type and id, action,
  before/after values, timestamp.
- Where logging is enforced so a new handler cannot silently skip it. Handler-level, not
  UI-level.
- Retention: the log is the audit trail, so entries are never edited and never
  soft-deleted. Consider whether a soft-deleted transaction's log entries survive.
- Who can read it: owner only, or managers too.
- How it surfaces in the UI, and whether it belongs on wallet settings.

Surface, before proposing a design:

- Whether existing handlers share a common wrapper or middleware that logging could hook
  into, or whether each handler would need an explicit call — and the risk that carries.
- What before/after shape is worth storing for a money-changing edit, given amount
  changes have balance consequences.
- Whether log writes belong in the same database transaction as the action they record.
  Argue both ways: same transaction means a log failure rolls back real work; separate
  means an action can succeed unlogged.
- Interaction with statement snapshots: a shared statement is frozen, but a later edit to
  a transaction inside that period means the owner's live view and the recipient's
  snapshot disagree. Whether the log should make that detectable.
- Volume: whether this table needs its own retention or partitioning strategy.

Do not produce a REASONS Canvas yet. Output the analysis only.

## Domain Concept Identification

### Existing Concepts (from codebase)

- **Tenant (v1)**: Equals better-auth user id. Wallet ownership is `wallet.tenant_id = session.user.id`. Distinct from the _actor_ who performs a write — after MR 11 a manager's session id is not the wallet's tenant id.
- **Wallet**: Named balance container (`amount`) owned by a tenant; soft-deleted. Mutated by rename (`PATCH /api/wallets/:walletId`, managers allowed) and soft-delete (`DELETE`, owner-only via `requireOwnedWallet`).
- **Transaction**: Income/expense row on one wallet; create/edit/delete adjust `wallet.amount` atomically inside `db.transaction()` (relative SQL deltas after MR 12). Soft-deleted; list/statement paths hide soft-deleted rows. No categories — description is free text.
- **Transfer**: Not a first-class table. `POST /api/wallets/transfer` creates a linked expense+income pair across two wallets in one DB transaction; both wallets require write access for the actor.
- **WalletMember**: Invite with `viewer` | `manager`, `pending` | `active`, soft-delete. Member management (invite/role/remove) stays owner-only (`requireOwnedWallet`). Separately, `requireWalletAccess` may auto-activate a pending invite and backfill `user_id` on first matching session — a mutation that is not a dedicated "member" API call.
- **WalletStatementShare**: Owner-only create/list/revoke. Persists a frozen `snapshot_json` at create time; public endpoint serves that snapshot, never recomputes. Snapshot rows intentionally omit transaction ids (type, amount, description, occurredAt, runningBalance only).
- **Actor / Session**: Every Netlify handler resolves `auth.api.getSession` independently; no shared request middleware. Actor identity available as `session.user.id` (+ email) after auth.
- **Tenant-access helpers**: `requireWalletAccess` / `requireWalletWriteAccess` / `requireTransactionWriteAccess` / `requireOwnedWallet` in `netlify/functions/lib/tenant-access.ts` are the authorization choke point — not a mutation or logging choke point. Handlers are flat default exports with no common wrapper.
- **Attachment**: Managers can upload/delete attachment objects in R2 (hard delete). Not in the stated activity-log scope, but MR 11 made attachment writes multi-actor.

### New Concepts Required

- **Wallet activity log entry**: Append-only record that an authenticated actor performed a specific action against a wallet-scoped entity. Survives soft-delete of the underlying entity. Never updated, never soft-deleted. Tenant-scoped for ownership/read (via wallet ownership), but authored by actor id which may differ from tenant id.
- **Logged action catalog**: Discrete action kinds covering the scoped mutation surface (transaction create/update/delete, transfer, wallet rename/delete, member invite/role change/remove, statement-share create/revoke). Must be closed enough to enforce completeness, open enough for future handlers.
- **Before/after change payload**: Structured snapshot of fields that changed (and, for money paths, enough to reconstruct balance impact). Not a full row dump of unrelated columns by default.
- **Activity log read model**: Authenticated listing of log entries for one wallet — authorization policy TBD (owner-only vs managers). Distinct from transaction list and from statement snapshots.
- **(Optional) Statement-divergence signal**: A derived or stored indication that a live ledger change after `snapshot_at` affects a period covered by an active share — not present today; statement shares and live ledger have no cross-link except shared `wallet_id` + overlapping dates.

### Key Business Rules

- **Accountability after multi-writer access**: Every balance-affecting or trust-affecting mutation on a wallet must be attributable to a session user — governs Transaction, Transfer, Wallet (rename/delete), WalletMember, WalletStatementShare, and (by product intent) future write handlers.
- **Append-only audit integrity**: Log entries are never edited and never soft-deleted; soft-deleting a transaction must not remove or hide its prior log entries — governs Activity log vs Transaction lifecycle.
- **Handler-level enforcement**: Logging is a server responsibility; UI omission must not create silent unlogged writes — governs all Netlify mutating handlers in scope.
- **Balance atomicity (existing)**: Transaction/transfer writes and `wallet.amount` updates remain in one DB transaction — activity log placement relative to that transaction is a strategic choice (see Strategic Approach), not a license to split balance+row writes.
- **Tenancy / anti-enumeration**: Reading another tenant's wallet log must be impossible; denials should follow existing "Wallet not found" patterns where applicable — governs Activity log read API.
- **Owner-only management surfaces stay owner-only**: Member and statement-share mutations are already owner-gated; logging them does not widen who can perform them. Who may _read_ the log is a separate policy.
- **Statement snapshot immutability (existing)**: Shared statements stay frozen; later edits do not rewrite `snapshot_json`. Detectability of live-vs-snapshot disagreement is a product concern layered on top, not a change to snapshot storage itself.

## Strategic Approach

### Solution Direction

Introduce a new append-only, wallet-scoped activity log table and a small server-side recording API used by mutating Netlify handlers. There is **no existing middleware or shared handler wrapper** to hook into: each function is an independent default export that calls `getSession` → access helper → Kysely. Enforcement therefore cannot be "invisible"; it must be either (a) an explicit record call at every write site, or (b) a deliberate consolidation of write paths into shared mutation helpers that always record — with CI/convention pressure either way.

Data flow (conceptual): authenticated mutating request → role-aware access check → business mutation (existing money atomicity rules) → persist activity log entry (same or companion write) → response. Read path: authenticated owner (or owner+manager) lists entries for one wallet, newest first, paginated.

UI: a wallet settings section is the natural first surface (settings already hosts members, statement shares, danger zone). The product question "can I account for every change?" also argues for discoverability from the wallet itself, but settings is the right default home unless product wants a primary tab.

### Key Design Decisions

- **Enforcement mechanism (wrapper vs explicit call)**
  - **Fact**: No Netlify middleware, no `withAuth`/`withTenant` wrapper, no service layer. Shared code today is access helpers only. Money paths already use local `db.transaction().execute` blocks inside each handler; create transaction does not even `.returning(['id'])` today, so entity id for a create log would require a small write-path change regardless.
  - **Trade-off**: Explicit per-handler calls match current architecture and are easy to land incrementally, but a new handler can omit logging silently — the exact failure mode the requirement wants to prevent. A forced wrapper around _all_ HTTP handlers is a large structural change and still does not know _what_ before/after to record without handler cooperation. Consolidating mutations into shared "write helpers" (e.g. createTransaction, updateTransaction, softDeleteTransaction, transfer, …) that always insert a log row is the middle path: new features that go through helpers are covered; bypasses remain possible but become the exception to review.
  - **Recommendation**: Treat logging as part of **shared mutation helpers** for money paths (highest stakes), plus explicit required calls for owner-only admin paths (members, statement shares, wallet delete). Add a review/checklist invariant ("mutating Netlify handlers must record activity") rather than inventing middleware that cannot infer payloads. Accept that true "cannot skip" enforcement is a process+structure goal, not something Netlify Functions give for free.

- **Same DB transaction vs separate log write**
  - **Same transaction**: Log insert commits or rolls back with the real work. Strength: no successful unlogged money change. Weakness: a logging bug/constraint failure aborts the user's real action (balance-affecting work fails because audit failed).
  - **Separate**: Action can succeed while log insert fails (silent accountability gap — worse for this product's "hold money for others" thesis). Async/out-of-band logging widens that gap further under crashes.
  - **Recommendation**: Prefer **same database transaction** for all balance-affecting actions (transaction CRUD, transfer, wallet soft-delete cascade). Prefer same transaction for member/share mutations too where they are single-statement today (wrap if needed). Accept that audit infrastructure must stay simple and reliable so it does not become a source of user-facing failures; keep payloads small and constraints permissive (jsonb, no fragile FKs that block logging when the entity is later soft-deleted — use soft references by id without `ON DELETE CASCADE` from transaction → log).

- **Before/after shape for money-changing edits**
  - Storing only "amount changed" is insufficient: type flip (income↔expense) reverses sign contribution; description/occurredAt changes do not move `wallet.amount` but do change what statements and shared snapshots meant.
  - Worth storing on transaction create/update/delete: `type`, `amount`, signed contribution (or enough to derive it), `description`, `occurredAt`, and for updates both before and after. Optionally store `walletAmountDelta` applied by the handler — makes balance consequences explicit without replaying ledger math later.
  - Avoid storing full wallet `amount` before/after as the _primary_ truth of the edit (concurrent writers make absolute wallet balances racey as context; MR 12 already moved balance updates to relative SQL). Delta + entity field snapshots are the accountable unit.
  - Transfer: store amount, note/description, from/to wallet ids, and both created transaction ids (once returning is added). Decide whether one logical "transfer" entry is duplicated onto both wallets' logs or only the source — dual-wallet accountability argues for **an entry visible on each affected wallet** (same action metadata, different `wallet_id`).

- **Who can read the log**
  - Owner-only maximizes privacy of "who did what" among members and matches owner-only member/share management.
  - Managers can already change the ledger; letting them read the log aids collaboration but also lets a manager see the owner's other administrative actions (invites, share create/revoke).
  - **Recommendation**: **Owner-only read in v1**. Rationale: the motivating user is the owner who must account for money held for others; managers already know their own actions; member/share admin events are owner-privileged. Revisit if managers need to dispute "I didn't change that."

- **Soft-deleted entities vs log survival**
  - Log rows must not use cascading deletes from `transaction` / `wallet_member`. Prefer nullable or non-FK entity id columns, or FKs without cascade. Entries for a soft-deleted transaction remain queryable by wallet id. Wallet soft-delete: either keep log rows readable for the owner forever (recommended for audit) or freeze access when the wallet is deleted — product choice; recommend **retain and allow owner read of history even after wallet soft-delete** if settings/history remains reachable, otherwise retain in DB for support even if UI hides them.

- **UI placement**
  - **Wallet settings** fits operational audit (alongside members and statement shares). A dense chronological feed with actor, action, entity summary, timestamp; expand for before/after.
  - Not a substitute for the transaction list; do not mix them.
  - Managers (if denied read) should not see the section — consistent with owner-only members/shares sections today.

- **Statement snapshot divergence**
  - Today: snapshot is frozen; live edits after `snapshot_at` create silent disagreement. Snapshot rows lack transaction ids, so exact row matching from share → live transaction is fragile (description/amount/date collisions).
  - Log can make divergence _detectable for the owner_ without changing public snapshot behavior: when recording a transaction update/delete (and create if `occurredAt` falls in a shared period), optionally mark or allow a query "active shares whose period overlaps this entity's occurredAt and snapshotAt < log.timestamp".
  - **Recommendation**: Do **not** rewrite snapshots. Do **surface detectability** as an owner-side concern in v1 design: either (a) store on the log entry a flag/list of overlapping active share ids at write time, or (b) compute overlap at read time from share period + `snapshot_at` vs log timestamp + entity occurredAt. Prefer (b) to avoid denormalized drift, unless UI needs a cheap badge. Exact "this snapshot row equals this transaction" remains imperfect until snapshots gain stable transaction ids (out of scope unless product wants it).

- **Volume / retention / partitioning**
  - Per-wallet write rate is human-scale (UI-driven), not high-frequency telemetry. Row size is small if before/after JSON is field-scoped.
  - **Recommendation**: No partitioning or TTL for v1. Index `(wallet_id, created_at desc)` (and possibly `tenant_id` if denormalized for owner queries). Explicitly reject soft-delete and reject automatic purge. Revisit partitioning only if a single wallet accumulates very large history (unlikely near-term); if ever needed, range-partition by `created_at` without deleting old partitions — archive, don't destroy accountability.

### Alternatives Considered

- **HTTP middleware that auto-logs every mutating request**: Rejected as insufficient — request body alone does not yield reliable before-state; DELETE/PATCH need pre-mutation reads already held in handlers; transfer spans two wallets.
- **UI-only history or relying on `updated_at`**: Rejected — does not record actor; managers and owners share the same rows; soft-delete erases visibility of past presence from lists.
- **Outbox / async log consumer**: Rejected for v1 — increases "succeeded unlogged" risk and operational complexity for little throughput benefit.
- **Reusing statement share or transaction rows as audit**: Rejected — statements are frozen customer-facing documents; transactions are mutable soft-deletable ledger facts, not an actor audit trail.
- **Managers can read the activity log in v1**: Deferred — conflicts with owner-only admin privacy; easy to widen later.

## Risk & Gap Analysis

### Requirement Ambiguities

- **Read ACL**: Owner-only vs managers — not decided; recommendation above is owner-only v1.
- **Attachment mutations**: MR 11 reason-for-now cites attachments, but scope list omits attachment upload/delete. Leaving them unlogged recreates a multi-actor blind spot (evidence added/removed without attribution). Needs an explicit include/exclude decision.
- **Wallet create**: Out of listed scope; low accountability value (actor is always the new tenant owner). Confirm exclude.
- **Invite auto-activation**: `requireWalletAccess` mutates `wallet_member` (pending→active, userId backfill) outside member handlers — is that a logged "member activated" event? Ambiguous; if yes, logging inside the access helper couples auth to audit.
- **Transfer representation**: One logical event vs two per-wallet entries; how entity type/id is set when two transaction ids exist.
- **Wallet soft-delete cascade**: Handler soft-deletes all transactions then the wallet — one wallet-delete log entry vs also per-transaction delete entries (noise vs completeness).
- **Before/after for non-money admin actions**: Member invite/role/remove and share create/revoke need a minimal payload contract (email/role/status; share period/title/shareId) — underspecified beyond "before/after values."
- **Historical backfill**: No requirement to invent log entries for pre-feature mutations — confirm greenfield-from-deploy-only.
- **Actor display**: Store only user id, or also denormalize email/name at write time so later account changes/deletions do not blank the audit UI.

### Edge Cases

- **Soft-deleted transaction**: List APIs hide it; log must still show create/edit/delete history for that entity id.
- **Edit that only changes description or occurredAt**: No balance delta, but statement/share meaning changes — must still log; divergence with shares still relevant for occurredAt moves into/out of a shared period.
- **Concurrent managers**: Two near-simultaneous edits produce two log entries; order by timestamp; balance remains relative-update safe, but before/after snapshots are per-request reads and may not tell a story of "final" state without reading both entries.
- **Transfer where actor is manager on one wallet and owner on the other**: Both legs already require write access; log must attribute the same actor on both wallet feeds if dual-entry model is chosen.
- **Revoked vs expired statement share**: Divergence detection should define whether only `isActive` shares matter or all shares ever created.
- **Owner renames wallet**: Manager-visible name change; log useful for owners reviewing manager renames too.
- **Failed request after partial work**: Same-DB-transaction logging avoids partial ledger+missing log; handlers that today do not use a transaction for multi-step admin writes should not introduce partial log/entity splits.

### Technical Risks

- **Silent omission**: Flat handlers + no middleware → highest delivery risk. Mitigation: shared mutation helpers for money paths; checklist in PR/AGENTS; tests that assert a log row exists after each mutating API call in the Vitest project.
- **FK / cascade destroying audit**: Referencing `transaction.id` with `ON DELETE CASCADE` would violate retention if anything ever hard-deleted; soft-delete does not cascade today, but wallet `ON DELETE CASCADE` from migration 0001 is a footgun if hard delete were ever used. Mitigation: log table without cascading FKs to mutable entities.
- **Create paths without returned ids**: `wallet-transactions.mts` insert currently does not return id — logging cannot record entity id without changing the insert. Same for transfer inserts.
- **PII in before/after JSON**: Member emails and descriptions may be sensitive; log read ACL and retention-forever amplify exposure — owner-only read helps.
- **Statement divergence without transaction ids in snapshots**: Detection can be period-level ("something in this period changed after snapshot"), not row-level proof. Over-claiming row identity would be dishonest.
- **Volume**: Unlikely a problem at human write rates; unbounded growth is acceptable for v1; monitor largest wallets later rather than pre-building partitions.
- **Coupling log failure to money failure**: Same-transaction choice means a bad check constraint on the log table blocks payments/transfers — keep schema simple; test migrations.

### Acceptance Criteria Coverage

Derived from the scope bullets (requirement did not number ACs):

| AC# | Description                                                                  | Addressable?             | Gaps/Notes                                                                     |
| --- | ---------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------ |
| 1   | Append-only log covering transaction create/edit/delete                      | Yes                      | Needs shared or explicit handler instrumentation; create must return entity id |
| 2   | Log covers transfer                                                          | Yes                      | Dual-wallet entry model and entity id pair must be decided                     |
| 3   | Log covers wallet rename/delete                                              | Yes                      | Cascade-delete noise (per-tx vs single wallet-delete) open                     |
| 4   | Log covers member invite/role change/removal                                 | Yes                      | Auto-activation in access helper not in scope list — clarify                   |
| 5   | Log covers statement-share create/revoke                                     | Yes                      | Preview-only POST should not log a share create                                |
| 6   | Entry records actor, wallet, entity type/id, action, before/after, timestamp | Yes                      | Exact JSON shape deferred to REASONS; actor denormalization open               |
| 7   | Logging enforced at handler level, not UI                                    | Partial                  | No middleware exists; enforcement is structural+process, not absolute          |
| 8   | Entries never edited / never soft-deleted                                    | Yes                      | Schema + API must forbid update/delete routes                                  |
| 9   | Soft-deleted transaction's log entries survive                               | Yes                      | Avoid cascading FKs; read-by-wallet not join-only-to-live-tx                   |
| 10  | Read access policy (owner vs managers) decided and implemented               | Partial                  | Product decision required; analysis recommends owner-only                      |
| 11  | UI surfaces the log; settings placement decided                              | Yes                      | Settings recommended; wallet-primary nav optional later                        |
| 12  | Money edit before/after captures balance-relevant fields                     | Yes                      | Include type/amount/delta; not absolute wallet balance as source of truth      |
| 13  | Log write atomicity policy chosen (same vs separate tx)                      | Yes                      | Recommend same transaction for balance-affecting paths                         |
| 14  | Statement live-vs-snapshot disagreement detectable via log                   | Partial                  | Period-level detectability yes; row-level identity limited by snapshot schema  |
| 15  | Retention/partitioning strategy chosen                                       | Yes                      | Forever retain, no partition in v1                                             |
| 16  | Attachment multi-actor writes attributable                                   | No / out of stated scope | Explicitly called out in "why now" but omitted from scope — decide             |

## Surfaced Design Inputs (requested before design)

These are folded into Strategic Approach / Risks above; summarized for REASONS Canvas intake:

1. **No common handler wrapper today** — only access helpers. Logging needs explicit calls or shared mutation helpers; pure middleware cannot supply before/after safely. Risk of silent skip is real.
2. **Money edit before/after** — store entity field snapshots (`type`, `amount`, `description`, `occurredAt`) plus applied `walletAmountDelta`; do not treat absolute `wallet.amount` as the edit's audit core.
3. **Prefer same DB transaction** as the recorded action for accountability; accept rollback-on-log-failure and keep the log schema boring so that failure mode stays rare.
4. **Statement interaction** — do not mutate snapshots; use the log (+ share period/`snapshot_at`) so the owner can detect post-share ledger changes at period granularity; row-level proof needs snapshot transaction ids (not present now).
5. **Volume** — no TTL, no soft-delete, no partitioning for v1; index for per-wallet chronological read.
