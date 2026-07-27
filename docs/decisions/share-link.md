# Decision Record: Read-Only Shareable Statement Link

Decisions for the share-link feature, verified against the codebase on 2026-07-27.
Supersedes the open questions in
`spdd/analysis/GGQPA-XXX-202607272048-[Analysis]-shareable-statement-link.md`.

---

## Verified Findings (Step 1)

### a) Transaction schema and user-supplied event date

**There is no user-supplied event date column today.**

| Fact                                                                                                                        | Source                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `transaction` columns are `id`, `wallet_id`, `type`, `amount`, `description`, `created_at`, `updated_at`, `deleted_at` only | `apps/ledger-box/src/lib/db/migrations/0001_create_wallet_and_transaction.ts`, `apps/ledger-box/src/lib/db/schema.ts` |
| Migrations `0002` and `0003` do not alter `transaction`                                                                     | `0002_add_wallet_tenant_id.ts` (wallet only), `0003_create_wallet_member.ts`                                          |
| Add-transaction Valibot schema: `type`, `amount`, `description` only                                                        | `apps/ledger-box/src/schemas/add-transaction.schema.ts`                                                               |
| Edit-transaction Valibot schema: same three fields                                                                          | `apps/ledger-box/src/schemas/edit-transaction.schema.ts`                                                              |
| Add-transaction UI: type, amount, description — no date control                                                             | `apps/ledger-box/src/modules/wallets/add-transaction-dialog/add-transaction-dialog.tsx`                               |
| Edit-transaction UI: same — no date control                                                                                 | `apps/ledger-box/src/modules/wallets/edit-transaction-dialog/edit-transaction-form.tsx`                               |
| On create, both `created_at` and `updated_at` are set to `now`                                                              | `apps/ledger-box/netlify/functions/wallet-transactions.mts` (POST handler)                                            |
| Transaction list and detail display **`createdAt`** to the user                                                             | `wallet-transaction.tsx`, `wallet-transaction-detail-sheet.tsx`                                                       |

**Conclusion:** The only timestamps are row metadata. There is no “when the money moved” field. Decision 2 is a **prerequisite**, not a column choice.

### b) Date filters on `GET /api/wallets/:walletId/transactions`

| Fact                                                                                        | Source                                                                              |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Filters (today / this month / last month / custom range) apply to **`updated_at`**          | `wallet-transactions.mts` lines 176–178                                             |
| Default **sort** is `createdAt` desc; sort can also be `updatedAt` or `amount`              | `apps/ledger-box/src/constants/sort-options.ts`, `wallet-transactions.mts` line 182 |
| Filter column (`updated_at`) and display column (`created_at`) are **already inconsistent** | Compare filter handler vs `wallet-transaction.tsx` line 49                          |

**Conclusion:** Period boundaries cannot safely use `updated_at` for statements (edits move rows between periods). `created_at` is closer to “entry date” but still wrong for backdated entries. A dedicated `occurred_at` column is required before share links ship.

### c) Timezone and where date-range boundaries are computed

| Fact                                                                                                                                                                                                                  | Source                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `@vhnam/utils` exports `getTodayRange`, `getThisMonthRange`, `getLastMonthRange` via date-fns `startOfDay` / `startOfMonth` — **no timezone parameter**                                                               | `packages/utils/src/date/utils.ts`                                                                    |
| Netlify handler uses a **duplicate** copy in `netlify/functions/lib/date-ranges.ts` with `setHours(0,0,0,0)` — also **no timezone**                                                                                   | `date-ranges.ts`                                                                                      |
| Preset filters (`today`, `this-month`, `last-month`): client sends only the `filter` enum; **server** recomputes bounds at request time with `new Date()` in the function runtime                                     | `wallet-actions.actions.tsx` (`toTransactionQuery`), `wallet-transactions.mts` (`getFilterDateRange`) |
| Custom date range: client converts `from`/`to` calendar dates to ISO bounds with `startOfDay`/`endOfDay` in the **browser**, then server **re-parses and re-applies** `startOfDay`/`endOfDay` in the function runtime | `wallet-actions.actions.tsx` lines 45–47, `date-ranges.ts` `getDateRange`                             |
| Netlify Functions run in **UTC**; product users are **UTC+7**                                                                                                                                                         | Netlify runtime convention; product context                                                           |
| Summary cards use the same `transactionQuery` as the list — they inherit whatever bounds the API applies                                                                                                              | `wallet-summary.actions.tsx` → `useTransactions`                                                      |
| Filter preview labels (`formatDate(new Date())`) are computed **client-side only** and do not affect the query                                                                                                        | `wallet-actions.actions.tsx` `filterPreview`                                                          |

**Conclusion:** For preset filters, boundaries are computed **server-side in UTC**, while the owner’s UI labels imply **local (UTC+7) calendar days**. For custom ranges, bounds are computed twice in two environments (browser local, then server UTC), which can shift day boundaries. **This is an existing correctness bug in filters and summary cards**, not only a statement concern. A transaction at 06:00 on 1 July UTC+7 (23:00 on 30 June UTC) can land in the wrong day/month under preset filters today.

### d) Token and id generation in the codebase

| Fact                                                                                                                                             | Source                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| DB primary keys default to Postgres `gen_random_uuid()`                                                                                          | `0001`, `0003` migrations                     |
| Attachment ids use `crypto.randomUUID()` in Netlify Functions                                                                                    | `wallet-transaction-attachments.mts` line 115 |
| Client-side upload queue ids use `crypto.randomUUID()`                                                                                           | `transaction-attachments-sheet.actions.ts`    |
| No sequential or predictable token scheme exists                                                                                                 | —                                             |
| Netlify Functions target **Node 24** (`netlify.toml`); Web Crypto `crypto.getRandomValues` / `crypto.randomUUID` / `crypto.subtle` are available | `netlify.toml`, Node 24 globals               |

**Conclusion:** The established pattern for unguessable ids is **CSPRNG** (`crypto.randomUUID` or equivalent). Share-link tokens should use `crypto.getRandomValues` at higher entropy than UUID v4 alone.

---

## Decision 1 — Snapshot vs live computation

**Decision:** **Snapshot at link creation.** Store the full statement payload (opening balance, rows with running balance, closing balance, totals in/out, period bounds, `snapshot_at`) on the share record when the owner generates the link. Public `GET` serves the stored JSON only; it does not recompute from live transactions.

**Rationale:** The product context is an owner showing someone an account of money held on their behalf. A number that changes between two viewings—with no explanation—is the primary failure mode. Live computation also couples the recipient to future owner edits and soft-deletes, which undermines trust even when the ledger is “more correct” afterward.

**Consequences:** Costs storage per link and requires the owner to revoke and re-issue after corrections. Benefit: stable, explainable statements; snapshot period totals are fixed even if the owner later edits unrelated transactions. If we chose live instead, we would need prominent “live view” disclaimers and would still fail the accountability use case. Wrong choice here is expensive to undo without migrating stored snapshots retroactively.

---

## Decision 2 — Which date column bounds the statement period

**Decision:** Introduce **`occurred_at`** (`timestamptz`, not null) on `transaction` as the sole period boundary for statements and for all date-range filters. Do **not** use `updated_at` or `created_at` for period membership.

**Prerequisite migration `0004_add_transaction_occurred_at_and_wallet_timezone`:**

- Add `occurred_at timestamptz not null`.
- Backfill existing rows: `occurred_at = created_at`.
- Index `(wallet_id, occurred_at)` where `deleted_at is null` (supports statement queries).
- Add `wallet.timezone text not null default 'Asia/Ho_Chi_Minh'` (see Decision 6).

**Form changes (same release as `0004`, before share links):**

- Add-transaction: date control, default **today in the wallet’s timezone** (Decision 6).
- Edit-transaction: date control, pre-filled from `occurred_at`; changing amount or description must **not** change `occurred_at` unless the user edits the date.

**Filter/sort migration:** In the **same change** as `0004`, switch `wallet-transactions.mts` date filters from `updated_at` to `occurred_at`. Change default list sort to `occurred_at` desc (align display, filter, and statement). Keep `updated_at` for “last modified” only if needed internally; it must not affect period totals. Compute all period boundaries **server-side** using `wallet.timezone` (Decision 6) — remove duplicate client-to-ISO boundary encoding for presets.

**Rationale:** No event-date column exists today (see Verified Findings). `updated_at` moves on edit and silently reshuffles period totals. `created_at` cannot represent backdated entries the owner will need for accurate statements.

**Consequences:** Share-link migration becomes **`0005`** (not `0004`). Shipping share links before `0004` would bake wrong period semantics into snapshots. Decision 2’s original reference to “existing date-range conventions” is **superseded by Decision 6** — those conventions are buggy for UTC+7 users and must be replaced, not preserved.

---

## Decision 3 — Wallet name on the public page

**Decision:** **Never expose `wallet.name` on the public statement page.** Add an optional per-link **`display_title`** (nullable text, max ~80 chars) on the share record. Public heading: `display_title` if set, otherwise the fixed string **“Account statement”**. Authenticated owner UI may show wallet name alongside the link for management context only.

**Rationale:** Wallet names are chosen for the owner’s navigation and may identify a person, project, or counterparty. A per-link label lets the owner write “March holding — Lan” without exposing internal wallet naming. The extra column is one nullable field on a table we are creating anyway.

**Consequences:** Small schema and form cost on create-link. If we defaulted to `wallet.name`, owners could not safely share without renaming wallets first, and we could not redact identifying labels per recipient. Omitting `display_title` entirely would force anonymous headings only—acceptable but less useful for owners managing multiple links.

---

## Decision 4 — Default expiry and distinct failure states

**Decision:**

- **Default expiry:** **90 days** from creation when the owner does not set one. Owner may set a shorter or longer expiry, or explicit “no expiry” (null `expires_at`) as an advanced option—not the default.
- **Distinct states in storage:** `revoked_at` (owner action) and `expires_at` (time) are separate columns. A link is **active** only when `revoked_at is null` and (`expires_at is null` or `expires_at > now()`).
- **Public HTTP responses (recipient-facing):**

| Condition                       | Status       | Body (generic, no tenant/wallet ids)     |
| ------------------------------- | ------------ | ---------------------------------------- |
| Token not found (invalid/guess) | **404**      | “This link is not valid.”                |
| Revoked                         | **410 Gone** | “This link has been revoked.”            |
| Expired                         | **410 Gone** | “This link has expired.”                 |
| Wallet soft-deleted             | **410 Gone** | “This statement is no longer available.” |

Do **not** return 404 for revoked or expired links—the recipient should know the link once existed.

**Rationale:** Links accumulate; a 90-day default limits orphaned access without forcing owners to revoke manually. Distinguishing expired vs revoked helps recipients (e.g. “ask for a new link” vs “owner withdrew access”). Invalid tokens stay 404 to avoid leaking whether a guess was ever valid.

**Consequences:** Owner “live links” list must treat expired links as inactive. Choosing “never expire” by default would increase long-lived leak risk. Using 404 for all failures would confuse recipients who bookmarked a real link.

---

## Decision 5 — Wallet soft-delete and live links

**Decision:** **Check dependencies at request time**; do **not** cascade `revoked_at` onto share rows when the wallet is soft-deleted. On every public serve: after resolving the token, verify `wallet.deleted_at is null` (join or lookup). Return **410 Gone** with “This statement is no longer available” if the wallet is deleted.

**General rule for all link dependencies:** _A share link is servable only if (1) the share row is active (not revoked, not expired) and (2) every **live** dependency still passes at request time—today that is “wallet exists and is not soft-deleted.” The snapshot is immutable; eligibility is not._

**Rationale:** Wallet soft-delete already soft-deletes all transactions (`wallet.mts` DELETE). There is **no wallet restore** API today. Request-time checks survive a future restore without mutating share rows. Cascading revocation would mark shares revoked on delete and require un-revoking on restore, coupling two concerns.

**Consequences:** Owner’s link list may still show links for deleted wallets until filtered in UI (show as inactive / unavailable). Snapshot content remains in DB for audit but is not served. If we cascaded revocation, restoration (if ever built) would need explicit reactivation logic.

---

## Decision 6 — Timezone alignment

**Decision:**

- Store authoritative timezone on **`wallet.timezone`** (`text`, IANA name, `not null`, default **`Asia/Ho_Chi_Minh`**). All calendar-day and calendar-month period boundaries—for filters, summary cards, statement snapshot generation, and share-link period selection—are computed **server-side only** from this zone. The client sends filter intent (preset enum or `from`/`to` calendar dates); it does **not** send pre-computed UTC instants for presets.
- **`occurred_at`** is stored as `timestamptz` (absolute instant). The add/edit date control captures a **calendar date in `wallet.timezone`**; the server converts to instants. List display shows dates formatted in `wallet.timezone`.
- **Ship in the same migration as `occurred_at` (`0004`).** Both answer “which day does this transaction belong to?” — a calendar date without a zone is ambiguous; an instant without a zone for boundaries is wrong for UTC+7 users.
- **Public statement page** shows the period and timezone used, e.g. `1 Jul 2026 – 31 Jul 2026 (Asia/Ho_Chi_Minh)` plus `snapshot_at` in that zone. Recipients must see which calendar the numbers use.
- Replace the duplicate `netlify/functions/lib/date-ranges.ts` logic with a single server helper that takes `(wallet.timezone, preset | from/to dates)` and returns UTC instants for SQL bounds. Fix preset-filter UTC bug and custom-range double-conversion bug as part of `0004`.

**Rationale:** Verified Finding (c): preset filters use UTC on the server while owners are in UTC+7; custom ranges are normalized twice in different zones. This already breaks “today” and “this month” near midnight and mis-assigns transactions—summary cards inherit the same wrong bounds. Statements would inherit the same bug if built on current helpers.

**Consequences:** `0004` grows slightly (one `wallet` column + server timezone helper). Per-wallet timezone setting UI can be deferred—default `Asia/Ho_Chi_Minh` is correct for all current users. If we shipped `occurred_at` without timezone, owners would pick calendar dates in an undefined zone and filters would remain UTC-broken. **Refines Decision 2** (same migration, replaces “existing date-range conventions”); does not contradict snapshot or period-column choices.

---

## Decision 7 — PII in snapshots

**Decision:** **Mandatory preview step** before a link can be created. The owner must see the exact statement the recipient will receive (full snapshot render) and explicitly confirm (“Create link”). No per-link “hide descriptions” option in v1; descriptions are included in the snapshot as written.

**Rationale:** Descriptions are free text the owner wrote for themselves and may contain third-party names, account fragments, or private notes. Snapshotting freezes that content. A preview forces informed consent without a new column or a stripped-down statement mode. Hiding descriptions would remove the accountability value of the statement—recipients would see amounts without knowing what each line was for, which defeats “here is your account.”

**Consequences:** Extra UI step on create-link (acceptable). Owner cannot claim they did not see what was shared. If a description is sensitive, the owner must edit the transaction before previewing—not ideal but honest. A future `omit_descriptions` flag remains possible if preview proves insufficient; not needed for v1.

---

## Decision 8 — Public endpoint rate limiting and token specification

**Decision:**

**Token (unguessability — primary defense against brute force):**

- Generate **32 random bytes** via `crypto.getRandomValues` (CSPRNG; available in Node 24 Netlify runtime — same family as existing `crypto.randomUUID()` usage).
- Encode as **base64url** (~43 characters) for the URL path segment.
- Store **SHA-256 hash** of the raw token only (`token_hash`, unique index). Raw token shown once at creation.
- Token is **not enumerable** — no sequential ids, wallet ids, or ULIDs in the public URL.

Rate limiting does **not** substitute for entropy; at 256 bits, guessing is infeasible. Rate limiting addresses **abuse and leak detection**.

**Rate limiting and access tracking (on `wallet_statement_share` row):**

- **`access_count`** (integer, default 0) — incremented on each successful public serve.
- **`last_accessed_at`** (timestamptz) — updated on each successful serve. Shown to owner in live-links list (“last viewed …”) and useful for spotting a leaked link (sudden spike or unexpected recent access).
- **`rate_window_start`** + **`rate_window_count`** — rolling per-token limit: max **60 successful serves per 60 seconds** per share row; reset window when elapsed. Return **429 Too Many Requests** with a generic message when exceeded. Implemented in Postgres on the share row (no Redis, no Netlify built-in limiter) — acceptable for v1 single-tenant scale; may race under concurrent requests but sufficient for abuse throttling.

Rejected for v1: in-memory counters (not shared across function instances), IP-based tables (privacy/storage cost; defer unless 429 rate proves insufficient), Netlify-only edge limits (not conveniently available in-repo).

**Rationale:** Matches existing CSPRNG patterns. Owner benefits from access metadata independent of rate limiting. Postgres counters keep the public handler self-contained.

**Consequences:** `0005` share table includes token hash plus four access columns. Failed lookups (invalid token) should not increment counters (avoid oracle + noise). Platform WAF/CDN rules remain optional hardening later.

---

## Prerequisites (ship in order)

1. **`0004_add_transaction_occurred_at_and_wallet_timezone`** — `transaction.occurred_at` (backfill `created_at`), `wallet.timezone` (default `Asia/Ho_Chi_Minh`), index; server-side timezone-aware period helper (replace duplicate `date-ranges.ts`); add/edit transaction date controls; migrate `GET` filters and default sort to `occurred_at`; **fix existing UTC boundary bug** for presets and custom ranges.
2. **Statement computation helper** (authenticated, internal) — opening/closing balance, running balance, totals; uses `occurred_at` + `wallet.timezone`; used at snapshot time; excludes `deleted_at` rows; orders by `occurred_at asc`, id tiebreaker.
3. **`0005_create_wallet_statement_share`** — share table: `token_hash`, wallet id, tenant id, period bounds, `display_title`, `expires_at`, `revoked_at`, `snapshot_json`, `snapshot_at`, `access_count`, `last_accessed_at`, `rate_window_start`, `rate_window_count`.
4. **Share-link feature** — owner CRUD APIs (session + `requireOwnedWallet`); **mandatory preview** before create; token generation per Decision 8; public route outside `/_app`; public token API serving snapshot only with rate limit and access tracking.

Share links must **not** ship before prerequisite 1. Snapshots must use `occurred_at` + `wallet.timezone` semantics from day one.

---

## Closed (formerly Open)

| Item                 | Resolution                                                            |
| -------------------- | --------------------------------------------------------------------- |
| Event-date column    | Decision 2 — `0004`                                                   |
| Filter column        | Decision 2 — migrate to `occurred_at` in `0004`                       |
| Wallet restoration   | Decision 5 — request-time check; no restore API today                 |
| Timezone             | Decision 6 — `wallet.timezone`; combined in `0004`                    |
| PII in descriptions  | Decision 7 — mandatory preview; descriptions included                 |
| Public rate limiting | Decision 8 — Postgres counters + per-token 60/min; token spec defined |

---

## Remaining (out of scope for this record)

| Item                           | Notes                                                           |
| ------------------------------ | --------------------------------------------------------------- |
| Wallet restoration             | No API today; Decision 5 stands                                 |
| Per-wallet timezone UI         | Default `Asia/Ho_Chi_Minh` sufficient for v1; settings UI later |
| Platform WAF / CDN rate limits | Optional hardening on top of Decision 8                         |
| `omit_descriptions` per link   | Deferred; preview is v1 mitigation                              |
