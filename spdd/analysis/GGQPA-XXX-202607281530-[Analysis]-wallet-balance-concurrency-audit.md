# SPDD Analysis: Wallet Balance Update Concurrency Audit

## Original Business Requirement

Audit wallet balance updates for concurrency safety. Do not write a canvas or
implementation yet — investigate and report first.

Context: until MR 11, only the wallet owner could write to a wallet, so concurrent
writes were effectively impossible. MR 11 granted `manager` role write access, so two
sessions can now create, edit, delete, or transfer against the same wallet at the same
time. Every balance-update path was written under the old assumption.

Inspect the balance mutation in each of these handlers:

- `wallet-transactions.mts` (POST)
- `wallet-transaction.mts` (PATCH, DELETE)
- `wallet-transfer.mts`
- `wallet.mts` (PATCH / soft-delete)

For each, report:

1. Whether `wallet.amount` is updated with a SQL-relative expression
   (`amount = amount + ?`) or read into JS, computed, and written back as an absolute
   value. The second pattern loses one write under concurrency.
2. Whether the balance update and the transaction insert/update share one database
   transaction, and at what isolation level.
3. For transfers: whether both legs and both wallet balances are in a single
   transaction, and what happens if the second leg fails.
4. Whether any read-modify-write sequence exists without row locking
   (`SELECT ... FOR UPDATE` or equivalent in Kysely).

Then report separately:

- Whether the existing `apps/ledger-box` Vitest project (added in MR 11) could cover
  concurrent writes against the local Postgres, and what such a test would look like.
- Whether `wallet.amount` can currently be verified against the sum of non-deleted
  transactions, and whether any code does that. `#/lib/statement.ts` already computes
  balances from transaction rows — say whether it could serve as a reconciliation check.

Output findings as a short report with file references. Recommend fixes ranked by
severity, but do not apply them yet. If every path is already concurrency-safe, say so
plainly rather than inventing work.

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **Wallet**: the account whose `amount` column is the authoritative running balance — owned by a tenant, optionally shared with `manager`/`viewer` members (`src/lib/db/schema.ts`, `WalletTable`).
- **Transaction**: an income/expense row that contributes `+amount` or `-amount` to its wallet's balance; soft-deletable (`TransactionTable`).
- **WalletMember**: grants `manager` (read/write) or `viewer` (read-only) access to a wallet not owned by the caller — the MR-11 addition that makes concurrent writers possible (`WalletMemberTable`; access resolution in `netlify/functions/lib/tenant-access.ts`).
- **Tenant access resolution**: `requireWalletWriteAccess` / `requireTransactionWriteAccess` — the gate every mutating handler calls before touching balance data; returns the wallet row fetched pre-transaction.
- **Statement**: a read-only reporting view (`src/lib/statement.ts`) that independently recomputes balance from transaction rows and already logs (does not enforce) a mismatch against `wallet.amount` for the all-time case.

#### New Concepts Required

- None. This is a correctness fix to existing mutation paths, not a new feature — no new entities, tables, or endpoints are implied by the requirement.

#### Key Business Rules

- **Balance integrity invariant**: `wallet.amount` must always equal the sum of signed contributions (`income: +amount`, `expense: -amount`) of that wallet's non-deleted transactions — governs Wallet and Transaction.
- **Atomicity of paired writes**: every transaction insert/update/delete and its corresponding wallet balance adjustment must apply together or not at all — governs Wallet, Transaction.
- **Transfer atomicity**: a transfer's two transaction legs and two wallet balance adjustments must all succeed or all roll back together — governs Wallet, Transaction (transfer case).
- **Concurrent-writer safety** (implicit, newly relevant since MR-11): the balance invariant and atomicity rules above must hold even when two sessions (e.g., owner + manager, or two managers) write to the same wallet at the same time — this was previously true only because only one writer (the owner) could ever exist per wallet.

## Strategic Approach

#### Solution Direction

- Every balance-mutating handler (`wallet-transactions.mts` POST, `wallet-transaction.mts` PATCH/DELETE, `wallet-transfer.mts`) follows the same shape: fetch `wallet.amount` via the access-check query (outside or logically prior to the write's transaction), compute a new absolute value in JS, and write that absolute value back inside a `db.transaction()`. This is a classic lost-update race — under MR-11's concurrent-manager model, two writers can both read the same stale `amount` and one write silently overwrites the other.
- `wallet.mts` (PATCH rename, DELETE soft-delete) never touches `amount` and is not part of this problem.
- The general direction is to stop computing the new balance in JS from a pre-fetched value, and instead let Postgres apply the delta atomically as part of the write itself — this removes the race without needing to change transaction isolation level or add explicit row locking.
- Data flow stays as-is: HTTP handler → access check → `db.transaction()` wrapping insert/update + wallet balance write → response. Only the _value_ written to `wallet.amount` changes.

#### Key Design Decisions

- **SQL-relative update vs. row locking (`SELECT ... FOR UPDATE`)**: a relative update (`amount = amount + delta`) is atomic per-row regardless of isolation level and requires no extra query or lock hold time; explicit row locking would also fix the race but adds a lock-acquisition step and only helps if the code still needs the pre-update value in JS (it doesn't, once deltas are computed from validated input/existing rows rather than from `wallet.amount`) → **recommend the relative-update approach** as the primary fix, since none of the four mutation paths actually need the previously-read `wallet.amount` value once the delta is computed independently.
- **Fixing at the write site vs. introducing a service/repository layer**: the codebase has no service layer between Netlify handlers and Kysely — introducing one solely for this fix would be disproportionate → recommend fixing the four `.set({ amount: ... })` call sites directly, keeping the existing flat handler structure.
- **Isolation level changes**: no isolation-level increase (e.g., to SERIALIZABLE) is needed once relative updates are used, since Postgres applies `amount + ?` atomically under READ COMMITTED — avoids the retry-on-serialization-failure complexity that a stricter isolation level would introduce.

#### Alternatives Considered

- **Explicit row locking (`FOR UPDATE`) plus continued absolute-value writes**: rejected as the primary fix because it still requires re-reading `wallet.amount` inside the transaction after acquiring the lock (more code churn) for no correctness benefit over the simpler relative-update approach; noted as a secondary/complementary option only if a future handler genuinely needs the current balance mid-transaction for validation (e.g., an overdraft check).
- **Advisory locks or application-level mutex per wallet**: rejected — adds operational complexity (lock management, timeout/deadlock handling) that a single atomic SQL statement makes unnecessary.
- **Periodic reconciliation job as the primary fix**: rejected as a substitute for atomic writes — reconciliation only detects drift after the fact and cannot prevent a lost update from ever having occurred; retained as a secondary, lower-priority recommendation (reusing `statement.ts`'s existing sum-based check).

## Risk & Gap Analysis

#### Requirement Ambiguities

- The requirement doesn't specify whether a fix should be proposed/implemented in this phase or deferred — resolved by treating this command as investigation-only per explicit instruction ("Do not write a canvas or implementation yet — investigate and report first").
- Not specified whether performance/locking trade-offs should favor minimal write latency vs. strict serializability — resolved by favoring the lowest-overhead correct fix (relative SQL update), consistent with the existing codebase's lack of any isolation-level configuration today.

#### Edge Cases

- **Same-wallet transfer** (`fromWalletId === toWalletId`): already explicitly rejected by `wallet-transfer.mts` (400 response) — not a concurrency concern, but worth confirming stays rejected under any fix.
- **Concurrent transfer + direct transaction on one of the two legs' wallets**: a transfer touches two wallets in one transaction while a separate POST/PATCH/DELETE could concurrently touch just one of them — the fix must be uniform across all four handlers so this cross-handler race is also covered, not just same-handler races.
- **Soft-deleted transaction re-edit race**: PATCH/DELETE both read `existingTransaction` via `requireTransactionWriteAccess` before the transaction opens; a concurrent DELETE of the same transaction row between that read and the write is a separate (narrower) race not explicitly in scope of the balance-amount question, but worth flagging as boundary context.

#### Technical Risks

- **Lost updates (confirmed)**: all four amount-touching paths compute `nextAmount`/`walletDelta` in JS from a `wallet.amount` value read before or outside the write's transaction, then write it back as an absolute value with no row lock — under MR-11's concurrent-manager model this reliably drops one of two simultaneous writes. Impact: silent balance corruption with no error surfaced to either caller.
- **No detection today**: nothing on the write path checks `wallet.amount` against the transaction sum; `statement.ts` performs this reconciliation but only for the all-time statement view, and only logs a warning rather than blocking or alerting — drift could persist unnoticed for a long time.
- **Isolation level is implicit**: no `db.transaction()` call anywhere sets an explicit isolation level, so all mutating transactions run at Postgres's default READ COMMITTED — insufficient on its own to prevent the lost-update pattern currently used (READ COMMITTED does not re-check for concurrent modifications on a plain `SELECT` then `UPDATE ... SET amount = <literal>`).

#### Acceptance Criteria Coverage

| AC# | Description                                                                                                                                    | Addressable? | Gaps/Notes                                                                                                                                                                                                                                                                |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Report whether each handler uses SQL-relative vs. absolute-value writes                                                                        | Yes          | Confirmed: all four amount-touching handlers use absolute-value writes computed in JS; `wallet.mts` doesn't touch amount at all.                                                                                                                                          |
| 2   | Report whether balance update and transaction insert/update share one DB transaction, and at what isolation level                              | Yes          | Confirmed: yes, one `db.transaction()` per handler; isolation level is Postgres default (READ COMMITTED), never overridden anywhere in the codebase.                                                                                                                      |
| 3   | For transfers: both legs + both wallet balances in one transaction; behavior on second-leg failure                                             | Yes          | Confirmed: single transaction wraps both inserts and both wallet updates — a failure on either leg rolls back the entire transaction (no partial transfer), though the balance writes themselves are still subject to the same lost-update race as the other handlers.    |
| 4   | Report any read-modify-write without row locking                                                                                               | Yes          | Confirmed: no `FOR UPDATE` or equivalent locking exists anywhere in the audited handlers; every path is exposed.                                                                                                                                                          |
| 5   | Assess whether the Vitest project could cover concurrent writes against local Postgres, and sketch such a test                                 | Yes          | Confirmed: `vitest.config.ts` + `tenant-access.test.ts` show tests already run against a real local Postgres via the `db` instance — a `Promise.all` of two concurrent handler-level writes plus a final balance assertion is directly feasible; no such test exists yet. |
| 6   | Assess whether `wallet.amount` can be verified against transaction sum today, and whether `statement.ts` could serve as a reconciliation check | Yes          | Confirmed: `statement.ts` (lines 107–115) already performs exactly this reconciliation for the all-time view but only `console.warn`s — no other code path checks this; it's usable as a post-hoc detector or test assertion but does not itself prevent the race.        |

No AC gaps — the requirement was fully addressable through direct code inspection with no need for further clarification before recommending fixes.
