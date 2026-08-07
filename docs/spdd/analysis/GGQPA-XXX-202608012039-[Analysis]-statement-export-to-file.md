# SPDD Analysis: Statement Export to File

## Original Business Requirement

Feature: statement export to file.

Read `AGENTS.md` and MR 09 first. `#/lib/statement.ts` already builds a statement
snapshot (opening/closing balance, rows with running balance, period totals) in the
wallet timezone — this feature reuses it rather than recomputing.

Why: the shared link (MR 09) lets a beneficiary view a statement, but they cannot keep a
copy, and neither can the owner for their own records. A file is the artifact people
actually archive and forward.

Scope to analyse:

- CSV export first: column set, encoding (the data is Vietnamese — UTF-8 BOM handling for
  Excel), number and date formatting, and whether opening/closing balances appear as rows
  or as a header block.
- Where export is triggered: owner side from wallet settings, and whether the public
  statement page should offer download to the link recipient.
- Whether the export reuses a stored `snapshot_json` (for an existing share) or computes
  fresh for an arbitrary period the owner picks.
- Whether PDF is worth adding, and if so what generates it. Assess the cost honestly —
  if CSV covers the real need, say so.

Surface, before proposing a design:

- Whether export should be a new endpoint or a content-negotiated variant of an existing
  one.
- Whether a public-side download changes the rate limiting or abuse profile of
  `GET /api/public/statements/:token`.
- Whether Netlify Function response size limits constrain large periods, and what happens
  for a wallet with thousands of rows in range.
- Whether exported files should carry the timezone and generation timestamp so two
  exports of the same period are distinguishable.

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **StatementSnapshot** (`apps/ledger-box/src/lib/statement.ts`): the computed artifact — timezone, period bounds, opening/closing balance, per-row running balance, totals. Built by `buildStatement()`, which queries `transaction` scoped by `walletId` and a `PeriodBounds`. It is the single source of truth this feature must reuse, not recompute.
- **WalletStatementShare** (migration `0005_create_wallet_statement_share`, table `wallet_statement_share`): an owner-created, tokenized, revocable link with a frozen `snapshot_json` + `snapshot_at`, period bounds, optional `display_title`/`expires_at`, and access/rate-limit counters. This is the only place a snapshot is durably persisted today — a share row, not an export artifact.
- **Public statement read** (`GET /api/public/statements/:token`, `netlify/functions/public-statement.mts`): unauthenticated, token-hash lookup, 404/410 distinctions for invalid/revoked/expired, 60 req/min rate limit _per share row_ (via `rate_window_start`/`rate_window_count` columns), returns `{ displayTitle, snapshot }` as JSON.
- **Owner statement-share creation** (`POST /api/wallets/:walletId/statement-shares`): authenticated, tenant-scoped via `requireOwnedWallet`. Accepts an arbitrary owner-picked period (`periodFrom`/`periodTo` calendar dates converted to wallet-timezone bounds via `calendarDateToOccurredAtStart`), builds a **fresh** snapshot via `buildStatement`, and either returns it as a preview (`?preview=true`, not persisted) or persists it as a new share with a token.
- **StatementSnapshotView** (`src/modules/statement/statement-snapshot-view.tsx`): the only existing renderer of a snapshot — used both in the settings preview dialog and the public `/statement/$token` page. It already does the display-level formatting (currency via `formatCurrency`/`formatSignedCurrency` from `@vhnam/utils/currency`, dates via `Intl.DateTimeFormat` with the snapshot's timezone) that a CSV/PDF export needs to mirror, not reinvent.
- **Currency/date formatting utils** (`packages/utils/src/currency`, `packages/utils/src/date`): VND-only compact/standard formatting (`formatCurrency` defaults to Vietnamese locale + compact notation for VND), no existing CSV/number-plain-text formatter — export will need a distinct "plain numeric" format since compact notation ("1.2tr") is unsuitable for spreadsheet math.
- **Activity log** (`wallet_activity_log`, `recordActivity`): append-only, written in the same DB transaction as the mutation for in-scope mutators including statement shares. An export that doesn't create or mutate any row arguably has nothing to log — but a "who downloaded when" audit trail is a plausible ask worth flagging (see Risks).
- **Tenancy scoping** (`AGENTS.md`, `netlify/functions/lib/tenant-access.ts`): every owner-side wallet endpoint must resolve tenant and call `requireOwnedWallet`/`requireOwnedTransaction`. A new owner-triggered export endpoint must follow the same pattern; the public-side one instead relies on token possession, not tenancy.

#### New Concepts Required

- **Export format encoder(s)**: pure functions that take a `StatementSnapshot` (+ optional `displayTitle`) and produce a file body — at minimum a CSV encoder. This is new but analogous to `StatementSnapshotView`: same input shape, different output medium (text/csv vs JSX). Natural home is `apps/ledger-box/src/lib/` alongside `statement.ts`, since it's pure data transformation with no DB/HTTP concerns and is plausibly shared between an owner endpoint and a public endpoint.
- **Export trigger surface(s)**: how a client asks for a file instead of JSON. Two candidate concepts — a new dedicated endpoint, or a format parameter/`Accept` header on existing endpoints. This is a genuinely open strategic decision (see below), not something the codebase already answers.
- **Download UI affordance**: a button/action on the owner's wallet-settings statement-share flow, and possibly on the public `/statement/$token` page. No existing UI concept covers triggering a file download (as opposed to JSON fetch via TanStack Query) — needs a plain `<a download>`/blob-URL pattern since the existing API client layer (`statement-share.api.ts`) is JSON-oriented.

#### Key Business Rules

- **Never recompute a statement independently of `buildStatement`** — the requirement is explicit that this reuses the shared snapshot builder. Any export path (owner-triggered fresh, or from an existing share's frozen `snapshot_json`) must produce numbers traceable to that one function, preserving the "balances must be provable" principle from `AGENTS.md`.
- **Wallet-timezone fidelity** — dates/times in the export must reflect the wallet's timezone (as `StatementSnapshotView` already does), not server or browser local time, since the underlying snapshot dates are UTC ISO strings requiring timezone-aware formatting.
- **Frozen vs. fresh snapshot distinction** — a share's `snapshot_json` is deliberately frozen at creation time (`snapshotAt`) and does not reflect later edits to transactions in that period; an owner exporting "for today" for an arbitrary period must get a _fresh_ `buildStatement` call. These are different data sources with different correctness guarantees and must not be silently conflated behind one "export" affordance.
- **Tenancy on the owner side** — an owner-triggered export of an arbitrary period is a new tenant-scoped read path and must go through `requireOwnedWallet`, matching every other wallet-scoped endpoint.
- **Token-only auth on the public side** — a public-side download (if added) must not weaken the existing "unauthenticated but token+rate-limited" model; it doesn't get to skip the 404/410/429 distinctions that already protect enumeration and abuse.

## Strategic Approach

#### Solution Direction

The core reusable piece — encoding a `StatementSnapshot` into a downloadable file — should be a pure, framework-agnostic function (or small set of functions per format) living beside `buildStatement` in `src/lib/`, mirroring how `StatementSnapshotView` already consumes the same snapshot shape for on-screen rendering. Both the owner-side and (if added) public-side HTTP handlers then become thin wrappers: fetch/build a `StatementSnapshot`, hand it to the encoder, set `Content-Type`/`Content-Disposition`, return the body. This keeps "how a statement is computed" (already solved, MR 08/09) fully decoupled from "how it's serialized for download" (new), and avoids duplicating balance logic — directly serving the requirement's explicit reuse constraint.

For triggering, the natural fit given the existing routes is to extend the _existing_ statement-share endpoints rather than mint a parallel API surface for the same underlying data — see the design decision below.

#### Key Design Decisions

- **New endpoint vs. content negotiation on existing routes**: Extending `GET /api/public/statements/:token` and `POST /api/wallets/:walletId/statement-shares` with a format switch (query param, e.g. `?format=csv`, is simpler and more explicit in Netlify Functions than `Accept`-header negotiation, which requires inspecting headers manually with no framework-level content-negotiation support here) avoids a second endpoint that has to re-implement token lookup, rate limiting, revocation/expiry checks, and tenancy checks in parallel with the JSON path. A query param is also trivially expressible as a plain `<a href>` for file download (browsers can't easily set custom `Accept` headers on a navigation-triggered download, but they can hit a URL with a query string) — which matters because the download UI needs a real browser navigation/blob, not a fetch+JSON round trip. **Recommendation: extend existing routes with a `format` query parameter**, default `format=json` preserving current behavior, `format=csv` returning `text/csv` with `Content-Disposition: attachment`. This is a variant of the existing route, not a new resource.
- **Reuse frozen snapshot vs. compute fresh**: The two trigger points have different natural answers, and the requirement's own framing ("owner triggered from wallet settings" vs "public statement page ... to the link recipient") maps directly onto them. **Recommendation:** the public-side download (`GET /api/public/statements/:token?format=csv`) serves the share's already-frozen `snapshot_json` — it's the same data the recipient already sees on-screen, and doing anything else would let a stale/revoked share's page show one set of numbers while its download shows another. The owner-side export is two distinct use cases that should not be collapsed: (a) exporting an _existing_ share re-serves its frozen snapshot for consistency with what was shared, and (b) a general "download a statement for a period I pick" action (not tied to any share) computes fresh via `buildStatement`, analogous to the existing `?preview=true` flow. This likely means the export affordance sits both on each share row (download this share's frozen file) and as an option in the create-share dialog after preview (download what I just previewed) — a UI decision to confirm in REASONS Canvas, not resolved here.
- **CSV structure**: opening/closing balance as a **header block** (a few key-value lines before the column headers), not as synthetic transaction rows — synthetic rows risk being miscounted as real transactions by anyone re-importing or summing the file, which directly conflicts with "balances must be provable." Column set should mirror `StatementSnapshotView`'s fields: date (wallet-timezone, ISO or locale date, not datetime unless sub-day precision is needed), description, type or signed amount, amount, running balance — plain numeric (no VND compact notation, no thousands-grouping that breaks spreadsheet parsing) so the file is spreadsheet-native.
- **Encoding**: UTF-8 with BOM (`﻿` prefix) is necessary for Vietnamese text to render correctly in Excel on Windows without a manual "import as UTF-8" step — Excel's naive CSV opener assumes the system codepage unless a BOM signals UTF-8. This is a small, well-understood addition to the encoder (prepend the byte sequence) and low-cost to include from the start rather than retrofit.
- **PDF**: **Not recommended for this pass.** A PDF generator is a new dependency (headless Chromium/Puppeteer, or a layout library like pdf-lib/pdfmake) with real cost in Netlify Function cold-start time and bundle size, and none of the requirement's stated "why" (archiving, forwarding, keeping a copy) requires PDF specifically — a CSV opened in Excel/Sheets and printed/exported to PDF by the user covers the same need with no new infrastructure. If a polished, pre-formatted, non-editable document is later a real ask (e.g., for sharing with a bank), that is a distinct, higher-cost feature to scope separately, not a variant of this one.

#### Alternatives Considered

- **New dedicated `/api/.../statement-shares/:shareId/export` (and public equivalent) endpoint**: rejected — it would duplicate token/ownership/rate-limit/expiry logic already correctly implemented on the existing routes, for no benefit over a format switch on the same route.
- **Client-side CSV generation from the JSON already fetched for preview/view**: rejected — the public statement page and the settings preview already have the full `StatementSnapshot` in memory, so encoding client-side is technically possible and avoids a server round trip. But it duplicates the encoder in two places (or requires shipping the same `src/lib` encoder to the browser bundle, which is viable since it's pure and dependency-free) and, more importantly, doesn't naturally support the "download an existing share without first loading the viewer" case from a share list row. Server-side generation via the format-switch endpoint is simpler to reason about uniformly. Worth revisiting in REASONS Canvas as a possible optimization for the "already-loaded" cases specifically.

## Risk & Gap Analysis

#### Requirement Ambiguities

- **Which "arbitrary period the owner picks" flow is in scope**: the requirement says export should work for "an existing share" and "an arbitrary period the owner picks," but doesn't say whether the latter requires a UI beyond the existing create-share dialog (e.g., a separate "just export, don't create a link" flow), or whether exporting _is_ now a third action alongside Preview/Create link in that dialog. This changes both API shape and UI scope non-trivially and needs resolution before REASONS Canvas.
- **Does the public statement page get a download button always, or only when the share allows it?** The requirement asks "whether" — implying it's not decided. If yes, does every share support download, or is it a per-share owner toggle (which would need a new column)? No existing precedent for optional/toggleable capabilities on a share.
- **File naming convention** is unspecified — wallet name, period, timezone, and generation timestamp all plausibly belong in the filename per the "distinguishable exports" ask, but exact format (and whether wallet name Vietnamese characters need sanitizing for filesystem-safety) is undefined.

#### Edge Cases

- **All-time statements** (`bounds === null`): `buildStatement` handles this today (`periodFrom`/`periodTo` are `null`, opening balance forced to 0) and reconciles against `wallet.amount` with only a console warning on mismatch, never a thrown error. An export of an all-time period with thousands of transactions is exactly the "large period" case flagged in the requirement, and also inherits the pre-existing possible-divergence-from-`wallet.amount` risk silently (already true for the JSON path; the export path doesn't add it, but should not paper over it either — the closing balance shown must be the computed one, matching what's already displayed).
- **Empty period** (`rows.length === 0`): `StatementSnapshotView` shows a placeholder message; the CSV encoder must decide whether an empty file with just the header block is acceptable output (recommended: yes, same information, no need for a special case).
- **Revoked/expired share exported via link before revocation propagates**: not a new issue introduced by export — the same 410 checks already gate the JSON path and would gate a `?format=csv` variant identically since it flows through the same handler.
- **Concurrent share creation for the same period**: two different `createdAt` shares can exist for overlapping periods with different `snapshot_json` if transactions changed between them — an owner exporting "this share" vs. "fresh for this period" could get two different files for what looks like the same date range. This is inherent to the frozen-snapshot design (already true today for viewing, not new to export) but export makes the divergence more visible/archivable, worth a one-line design note (e.g., filename or header block making snapshot_at prominent) rather than a schema change.

#### Technical Risks

- **Netlify Function response size / duration limits**: Netlify Functions (standard, non-Edge, given these use `Context`/`@netlify/functions` types and DB access) have response payload limits (6 MB synchronous response body is the commonly cited ceiling) and execution time limits (10s default, up to 26s on some plans). A CSV is far more compact than the equivalent JSON (no repeated key names, no nested object overhead), so the practical row ceiling before hitting the 6 MB cap is likely in the tens-of-thousands-of-rows range for typical row width — plausible for "thousands of rows" per the requirement's own framing, but worth a rough calculation in REASONS Canvas rather than assuming safety. The bigger risk is `buildStatement` itself: it loads the _entire_ opening-balance history (`occurredAt < bounds.start`, no limit) plus the full period range into memory with **no pagination**, unlike the transaction list endpoint — this is already true for the existing JSON/preview path (not new to export), but export is likely to be used for larger, less-recent periods (year-end archiving) than the UI's default preview window, making this the more probable trigger for the pre-existing scaling risk to surface in practice.
- **Rate limiting reuse**: because the recommended design reuses the exact same public handler and its per-share `rate_window_start`/`rate_window_count` columns, a `?format=csv` request consumes from the identical 60/min budget as JSON views — this is a feature, not a gap, but confirms the requirement's question: no new rate-limit dimension is needed unless downloads should be limited more strictly than views (e.g., to deter bulk scraping of a link for archival by a bot). No evidence in the codebase that this distinction is wanted; flag as a decision point, default to "no separate limit."
- **CSV formula/injection risk**: transaction `description` is free-text user input (per `AGENTS.md`, "Description is free text") and could start with `=`, `+`, `-`, or `@`, which Excel/Sheets may interpret as a formula when the CSV is opened — a known CSV injection vector. The encoder should neutralize leading formula-trigger characters (e.g., prefix with a `'` or leading space) in any user-supplied text field. This is a real, currently-unaddressed security consideration for a _new_ export surface (the JSON path is not vulnerable since it's never opened by spreadsheet software) and should be called out explicitly as a requirement in REASONS Canvas, not left implicit.
- **No activity log entry for downloads**: per `AGENTS.md`, activity logging covers "money-affecting writes" and named mutators (wallet rename/delete, members, statement shares) — a read-only export doesn't fit that pattern and the existing public JSON reads aren't logged either (only `accessCount`/`lastAccessedAt` counters are bumped). Consistent with current design not to add logging for this, but flagging since "who downloaded a copy" could plausibly matter for an accountability-focused app; recommend explicitly deciding to skip it rather than an oversight.

#### Acceptance Criteria Coverage

The requirement is framed as a scope-to-analyze / questions-to-surface document rather than a set of testable acceptance criteria — no ACs are enumerated. Below maps stated scope items to addressability instead of a formal AC table:

| #   | Scope item                                                                                 | Addressable? | Gaps/Notes                                                                                                                                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | CSV export: columns, UTF-8 BOM, number/date formatting, opening/closing as header vs. rows | Yes          | Direction recommended above (header block, plain numeric, BOM-prefixed UTF-8); exact column list to finalize in REASONS Canvas                                                                                                                          |
| 2   | Trigger points: owner wallet settings, public page                                         | Partial      | Owner side is clear; whether _every_ public share gets a download link, or it's opt-in, is unresolved (see Ambiguities)                                                                                                                                 |
| 3   | Reuse stored `snapshot_json` vs. compute fresh                                             | Yes          | Recommended split: existing-share export = frozen snapshot; arbitrary-period export = fresh `buildStatement` call                                                                                                                                       |
| 4   | PDF worth adding?                                                                          | Yes          | Recommendation: no, for this pass — CSV covers the stated need at far lower cost                                                                                                                                                                        |
| 5   | New endpoint vs. content-negotiated variant                                                | Yes          | Recommended: query-param format switch on existing routes, not a new endpoint                                                                                                                                                                           |
| 6   | Public-side download effect on rate limiting/abuse profile                                 | Yes          | Recommended: reuse existing per-share rate limit as-is; no new dimension unless a stricter download-specific limit is explicitly wanted                                                                                                                 |
| 7   | Netlify size limits for large periods                                                      | Partial      | Directionally addressed (CSV is compact, likely safe); exact row/size ceiling needs a concrete estimate in REASONS Canvas, and the pre-existing unpaginated-query risk in `buildStatement` should be flagged there even though it predates this feature |
| 8   | Files carry timezone + generation timestamp                                                | Yes          | `StatementSnapshot.timezone` and `snapshotAt` already exist and are exactly what's needed; just needs to be surfaced in the export header block/filename                                                                                                |
