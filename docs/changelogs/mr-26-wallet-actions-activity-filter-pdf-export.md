# mr-26 — Wallet actions polish, activity date filter, statement PDF export

**Branch:** `refactor/wallet-polish` → `main`

## Summary

Polishes the wallet-page period filter for locale-aware date display, lets wallet
owners narrow the Activity audit trail by calendar period (including this/last
week), adds printable PDF export beside existing CSV on all statement download
surfaces, rewrites local seeding for multi-currency demo data, and moves SPDD
docs under `docs/spdd/`.

## Added

### Activity log date filter

- `GET /api/wallets/:walletId/activity` accepts `filter`, `from`, and `to` with the
  same period semantics as transactions/summary; filters `createdAt` with half-open
  `[start, endExclusive)` bounds in the wallet timezone. Owner-only gate unchanged.
- Shared `resolvePeriodBounds` gains Monday-start ISO `this-week` / `last-week`
  windows; `FILTER_OPTIONS` adds those values (Activity exposes the full preset
  set; transaction list keeps its existing shorter list).
- Wallet Settings → Activity: period filter + date-range picker, URL search params
  via `wallet-activity-search.schema.ts`, React Query key includes filter identity,
  page resets to 1 on filter change.

### Statement PDF export

- `encodeStatementPdf` (`statement-export-pdf.ts`) builds a multi-page PDF from the
  same `StatementSnapshot` as CSV — title, period/timezone, generated-at, summary
  (opening/closing/in/out), then date / description / amount / running balance.
  Uses `pdfkit` with vendored Noto Sans Regular/Bold under
  `apps/ledger-box/assets/fonts/` (OFL). Amounts use standard notation (no VND
  compact “tr”); dates follow the viewer locale and snapshot timezone.
- Format query on all three existing export surfaces (default remains `csv` when
  omitted):
  - `GET /api/public/statements/:token?format=pdf`
  - `POST /api/wallets/:walletId/statement-shares?preview=true&format=pdf`
  - `GET /api/wallets/:walletId/statement-shares/:shareId/export?format=pdf`
- UI: Download dropdown (CSV / PDF) on the public statement page, create/preview
  dialog, and each share row.
- Locale: `Accept-Language` → PDF chrome via `createServerIntl`. CJK locales
  (`ja-JP` / `zh-CN` / `zh-TW`) still format dates/amounts in the viewer locale but
  use `en-US` chrome labels so CJK glyphs are not bundled in the Function.

### Local seeding

- `scripts/seed.ts` rewritten with `@faker-js/faker`; seeds multi-currency wallets
  and transactions through `createTransaction` / `recordActivity` so balances and
  the activity log stay consistent with production write paths.
- `db:seed` script and empty-wallet CTA copy updated accordingly.

### Tooling / docs

- SPDD analysis and prompt files live under `docs/spdd/`; slash-command examples
  updated to `@docs/spdd/...`.
- Agent guidance and a Cursor `beforeShellExecution` hook block `Co-authored-by` /
  “Made with Cursor” attribution on commits and PRs.

## Changed

- Wallet page actions bar: clearer period control, locale-aware period preview and
  date-range calendar (`DatePickerRange` + `LOCALE_DATE_FNS_LOCALE` /
  `formatDate`), without changing transaction query contracts or wallet timezone
  resolution.
- Statement export helpers generalize filename / format branching for CSV vs PDF;
  preview download API accepts a format argument.
- i18n catalogs (`en-US` / `en-GB` / `vi-VN` / `fr-FR` / `ja-JP` / `zh-CN` /
  `zh-TW`): period/week filter strings, wallet-actions period copy, and
  `statement.export.pdf.*` / download-menu labels.

## Out of scope (v1)

- CJK glyph fonts in the PDF Function bundle (chrome falls back to English labels)
- Activity logging for statement downloads (same as CSV / public JSON reads)
- Week presets on the transaction-page filter list
- New migrations or environment variables

## Setup after merge

```bash
vp install
```

Optional for local demo data:

```bash
pnpm --filter @vhnam/ledger-box db:seed
```

No new migrations, no new environment variables.

## Commits

- `893eacd` feat(ledger-box): update seeding
- `1593dae` chore: move SPDD docs under docs/
- `7aa86be` chore: update SPDD command paths
- `23efa3e` docs: ban AI co-author attribution in commits
- `597f8dd` refactor(ledger-box): polish wallet actions locale UI
- `96eb719` feat(ledger-box): add activity log date filter
- `c9f515c` feat(ledger-box): add statement PDF export
