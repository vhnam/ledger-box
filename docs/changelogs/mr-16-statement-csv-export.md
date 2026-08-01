# MR 16 — Statement CSV Export

**Branch:** `feat/statement-csv-export` → `main`

**Depends on:** MR 09 (statement builder, shareable statement links)

### Context

MR 09 let a wallet owner share a read-only statement link, and let a beneficiary view
it — but neither side could keep a copy. A file is the artifact people actually archive
and forward. This adds CSV export, reusing the existing `buildStatement` snapshot
builder rather than recomputing balances.

### Added

#### CSV encoder

- `#/lib/statement-export.ts` — pure, framework-agnostic `encodeStatementCsv` and
  `buildStatementCsvFilename`. Opening/closing balance, period, timezone, and
  generation timestamp are emitted as a header block (not synthetic transaction rows).
  Amounts are plain integers (no compact "tr"/"k" notation). Dates are formatted in
  the wallet's timezone. UTF-8 BOM-prefixed for correct Vietnamese rendering in Excel.
  Free-text fields (`description`, `displayTitle`) are escaped against CSV formula
  injection (`=`, `+`, `-`, `@` prefixes).

#### Export endpoints

- `GET /api/public/statements/:token?format=csv` — link recipient download of the
  share's frozen `snapshotJson`; reuses the existing token lookup, revocation/expiry
  checks, and per-share rate limit unchanged.
- `POST /api/wallets/:walletId/statement-shares?preview=true&format=csv` — owner
  download of a freshly computed statement for an arbitrary period; never persists a
  share row.
- `GET /api/wallets/:walletId/statement-shares/:shareId/export` (new route,
  `wallet-statement-share-export.mts`) — owner-only, tenant-scoped download of an
  existing share's frozen snapshot, for the case where the raw share token is no
  longer available (only its hash is stored).

#### UI

- "Download" action per share row in wallet settings, linking directly to the new
  export route
- "Download CSV" action in the create/preview dialog, alongside "Preview" and
  "Create link" (blob download using the server-supplied filename)
- "Download CSV" button on the public statement page

### Changed

- `statement-share.api.ts` / `statement-share.mutations.ts` — added
  `downloadStatementPreviewCsv` / `useDownloadStatementPreviewCsv`

### Out of scope (v1)

- PDF export — CSV covers the stated archiving/forwarding need at far lower cost; no
  new rendering dependency introduced
- Activity logging for downloads (consistent with existing unlogged public/preview
  JSON reads)
- Pagination of `buildStatement` for very large periods (pre-existing limitation,
  not introduced by this change)

### Setup after merge

```bash
vp install
```

No new migrations, no new environment variables.

### Commits

- `8fa99f3` feat(ledger-box): statement export to file
