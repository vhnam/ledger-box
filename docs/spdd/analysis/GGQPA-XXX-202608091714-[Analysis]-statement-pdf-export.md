# SPDD Analysis: Statement PDF Export

## Original Business Requirement

can we support export statement link with PDF?

we already support export as CSV.

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **StatementSnapshot** (`apps/ledger-box/src/lib/wallet/statement.ts`): the computed, balance-provable artifact — timezone, currency, period bounds, opening/closing balance, totals, per-row running balance. Built only by `buildStatement`. Both on-screen rendering and CSV export already consume this shape; PDF must do the same.
- **WalletStatementShare** (`wallet_statement_share`, migration `0005`): owner-created, tokenized, revocable link with a frozen `snapshot_json` / `snapshot_at`. Public and per-share owner downloads must serve this frozen snapshot so the file matches what was shared/viewed.
- **CSV export pipeline (MR 16)**: pure encoder `encodeStatementCsv` / `buildStatementCsvFilename` in `apps/ledger-box/src/utils/wallet/statement-export.ts`; three trigger surfaces already ship:
  - Public: `GET /api/public/statements/:token?format=csv`
  - Owner fresh period: `POST /api/wallets/:walletId/statement-shares?preview=true&format=csv`
  - Owner existing share: `GET /api/wallets/:walletId/statement-shares/:shareId/export` (today CSV-only, no `format` query)
- **StatementSnapshotView**: the human-facing layout of a snapshot (period, generated-at, balances, row table with locale-aware currency/date formatting). This is the visual reference a PDF should conceptually mirror — not invent a second statement model.
- **Download UI affordances**: public page and create/preview dialog expose explicit “Download CSV”; share list row exposes a generic “Download” link to the owner export route. Client preview download uses blob + `Content-Disposition` filename parsing (`downloadStatementPreviewCsv`).
- **Tenancy / public auth model**: owner paths use `requireOwnedWallet`; public path uses token hash + revocation/expiry + per-share rate limit. Export format must not invent a fourth auth model.
- **Prior strategic deferral**: MR 16 / the CSV analysis explicitly marked PDF out of scope — justified then as “CSV covers archiving/forwarding at far lower cost.” This requirement reopens that decision with an affirmative product ask.

#### New Concepts Required

- **PDF export encoder**: a pure (or mostly pure) function that takes a `StatementSnapshot` (+ optional display title / locale) and produces PDF bytes — the PDF counterpart to `encodeStatementCsv`, not a new balance computation path.
- **Export format as a first-class dimension**: today “export” effectively means CSV. Supporting PDF makes format selection a product concept across the same three trigger points (and forces the currently CSV-hardcoded owner share export route to become format-aware).
- **Human-readable document layout** (as a concept, not a layout spec): PDF is for reading/printing/forwarding as a fixed document, unlike CSV which is for spreadsheet math. Locale-aware currency and dates become desirable here in a way CSV deliberately avoided.

#### Key Business Rules

- **Balances must remain traceable to `buildStatement` / frozen `snapshot_json`** — PDF must never recompute opening/closing/running balances independently. Same frozen-vs-fresh split as CSV: existing share / public link → frozen snapshot; owner arbitrary-period download → fresh `buildStatement`.
- **Public download must not weaken token + rate-limit + 404/410 semantics** — format is an encoding choice after authorization, not a bypass.
- **Owner export remains tenant-scoped** — any PDF path for an existing share or fresh period must still go through `requireOwnedWallet`.
- **CSV remains available** — PDF is additive; the existing spreadsheet-native path stays the machine-readable archive format.
- **Provable presentation** — opening/closing balances and totals must appear as document metadata/summary, never as fake transaction rows that could be misread as ledger entries (same invariant CSV enforced via header block).

## Strategic Approach

#### Solution Direction

Treat PDF as a **second export encoding** of the same statement snapshot already used for CSV and on-screen view. Reuse the three existing trigger surfaces; add a PDF encoder beside the CSV encoder; switch response body/headers by `format` (or equivalent format selector on the owner share export route). Keep “how a statement is computed” unchanged and fully decoupled from “how it is serialized for download.”

This is a fullstack feature: Netlify handlers already return file attachments; UI already has download entry points that need CSV vs PDF choice (or parallel actions); no new DB tables or snapshot schema are required.

#### Key Design Decisions

- **Ship PDF now vs. keep deferring**: The earlier deferral was cost-based (“CSV covers archive/forward”). The product is now explicitly asking for PDF — typically because recipients want a non-editable, printable, forwardable document (banks, beneficiaries, paper trails), which CSV does not satisfy well. **Recommendation: proceed**, but keep scope to “PDF encoding of the existing snapshot on existing export surfaces,” not a redesign of statement sharing.
- **Generation technology class (strategic choice, library TBD in REASONS Canvas)**:
  - **Programmatic PDF in the Netlify Function** (layout library that emits PDF bytes from snapshot data): matches the CSV pattern (server encoder + `Content-Disposition`), works for share-row download without first loading a viewer, keeps one authoritative layout. Cost: new dependency, layout work, bundle/cold-start consideration — but far lighter than a browser.
  - **Headless Chromium / HTML-to-PDF**: highest visual fidelity to `StatementSnapshotView`, highest ops cost on Netlify (binary size, cold start, often incompatible with standard Functions without special packaging). **Reject for v1** unless fidelity requirements later force it.
  - **Client-only PDF** (print dialog / browser-side generator from already-fetched JSON): lowest server cost, but breaks the share-list “download without opening” path, fragments encoding across client/server, and makes public/owner behavior inconsistent. **Reject as the primary approach**; optional later enhancement only for already-loaded views.
  - **Recommendation: programmatic server-side PDF encoder**, parallel to `encodeStatementCsv`, invoked from the same three handler surfaces.
- **API shape**: extend the established `format` query pattern (`csv` | `pdf`, default remains JSON where JSON exists). The owner share export route today always returns CSV — it should become format-aware (`?format=pdf` / default `csv` for backward compatibility with existing “Download” links) rather than minting a parallel `/export.pdf` resource. **Recommendation: one format dimension across all export surfaces.**
- **Layout intent**: PDF should read as the statement the user already sees (period, generated-at, balances, chronological rows with running balance), using locale-aware human formatting — not as a spreadsheet dump. Exact typography/branding belongs in REASONS Canvas; strategically, prefer fidelity to `StatementSnapshotView` over inventing a new document genre.
- **UI surface**: every place that can download CSV should also be able to download PDF (public page, create/preview dialog, share row). Exact control pattern (split buttons vs. menu vs. two actions) is a UX detail for REASONS Canvas; strategically, do not leave PDF only on one of the three surfaces — that would recreate the frozen/fresh inconsistency users already understand across CSV.

#### Alternatives Considered

- **Leave PDF deferred indefinitely / tell users to print CSV from Sheets**: rejected as the product answer once PDF is an explicit ask; CSV remains complementary, not a substitute for a fixed document.
- **New dedicated PDF-only endpoints**: rejected — would duplicate auth, tenancy, token, rate-limit, and snapshot-loading logic already solved on the CSV export paths.
- **Store generated PDFs on R2 at share creation**: rejected for v1 — adds storage lifecycle, stale-file risk vs. frozen JSON, and upload complexity; generating on demand from `snapshot_json` (same as CSV) is sufficient and keeps one source of truth.
- **PDF only on the public link, not owner preview/share list**: rejected — owners also need an archivable copy of what they shared or of a period they pick; the CSV feature already established all three surfaces as in-scope.

## Risk & Gap Analysis

#### Requirement Ambiguities

- **What “export statement link with PDF” covers**: does it mean (a) public link recipients can download PDF, (b) owners can download PDF for an existing share, (c) owners can download PDF for a previewed period without creating a link, or all three? CSV already does all three; **assumption to confirm**: PDF mirrors CSV’s full surface coverage unless product narrows it.
- **Visual / branding expectations**: no sample layout, letterhead, logo, or “looks like a bank statement” bar was given. Ambiguity between a minimal tabular PDF and a polished branded document drives encoder complexity significantly.
- **Locale for PDF**: public recipients may not share the owner’s locale; CSV intentionally stays locale-independent for parseability. PDF should be human-readable — unclear whether to use owner locale at share creation, viewer `Accept-Language`, or a fixed locale. Needs an explicit decision.
- **Filename / multi-format UX on share rows**: today’s row control is a single “Download” that implies CSV. Adding PDF requires clarifying whether the primary action stays CSV, becomes a chooser, or splits into two labeled actions.

#### Edge Cases

- **Large statements (hundreds/thousands of rows)**: PDF is much larger and slower to generate than CSV; multi-page layout, memory, and Netlify response-size/time limits matter more than for CSV. Empty periods and all-time periods must still produce a valid (possibly short) PDF.
- **Long free-text descriptions**: PDF layout must wrap or truncate without corrupting row alignment or implying missing ledger lines.
- **Revoked/expired shares**: same 410/404 behavior as JSON/CSV; PDF must not be generatable after revocation via a cached alternate path.
- **Currency diversity**: snapshots now carry `currency` (post per-wallet currency work); PDF formatting must respect the snapshot currency, not hardcode VND display assumptions.

#### Technical Risks

- **New PDF dependency in Netlify Functions**: bundle size and cold start; native/binary-heavy options (Chromium) are especially risky. Mitigation direction: choose a pure-JS/WASM-friendly library evaluated against Function size limits during REASONS Canvas / spike, not at implement time by surprise.
- **Owner export route format blindness**: `wallet-statement-share-export.mts` currently always encodes CSV. Extending it carelessly could break existing “Download” links; defaulting omitted `format` to `csv` preserves compatibility.
- **Response size / duration**: PDF of a large all-time statement may approach Function payload or time ceilings sooner than CSV. Mitigation direction: same unpaginated `buildStatement` constraint as today; may need an explicit soft row ceiling or clear failure mode if generation is too heavy — flag for REASONS Canvas rather than silently assuming CSV-scale safety.
- **Rate limiting**: public `?format=pdf` will consume the same per-share 60/min budget as views/CSV. PDF generation is more expensive per request, so the abuse profile is slightly worse than CSV; default remains shared budget unless product wants a stricter download cap.
- **No activity log for downloads**: consistent with CSV (reads are unlogged except access counters on the public path). Confirm this remains acceptable when the artifact is a more “official” PDF.
- **i18n of UI strings only vs. document strings**: button labels must use `react-intl` catalogs; PDF internal labels (column headers, “Opening balance”, etc.) need a deliberate strategy (fixed English, owner locale catalogs via server intl, or viewer locale) — the invite-email `createServerIntl` pattern is a relevant precedent for server-side catalogs.

#### Acceptance Criteria Coverage

The requirement did not enumerate formal ACs. Coverage is assessed against the implied ask and the existing CSV export contract it extends:

| AC# | Description                                                                                      | Addressable? | Gaps/Notes                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------ | ------------ | -------------------------------------------------------------------------------------------------------------- |
| 1   | Public statement link recipient can download a PDF of the frozen snapshot they can already view  | Yes          | Mirrors `?format=csv` on `GET /api/public/statements/:token`; confirm this surface is in scope                 |
| 2   | Wallet owner can download PDF for an existing share without retaining the raw token              | Yes          | Extend owner `/export` route with format selection; preserve CSV default for existing links                    |
| 3   | Wallet owner can download PDF for an arbitrary previewed period without creating a share         | Yes          | Extend `?preview=true&format=pdf` parallel to CSV                                                              |
| 4   | PDF numbers match CSV / on-screen statement for the same snapshot (no independent recomputation) | Yes          | Encoder-only approach on `StatementSnapshot` / `snapshot_json`                                                 |
| 5   | CSV export continues to work unchanged                                                           | Yes          | Additive format; default behaviors preserved                                                                   |
| 6   | PDF is suitable as an archivable / forwardable document (human-readable layout)                  | Partial      | Addressable in direction, but visual bar and locale rules are underspecified — must be fixed in REASONS Canvas |
| 7   | Auth, tenancy, revocation, expiry, and public rate limits remain equivalent to CSV               | Yes          | Format branch after existing checks                                                                            |
