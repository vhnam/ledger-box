# MR 03 — Transaction CRUD & Attachments

**Branch:** `feat/manage-wallet` → `main`

### Added

#### Transactions

- API route `PATCH /api/wallets/:walletId/transactions/:transactionId` — edit transaction and adjust wallet balance
- API route `DELETE /api/wallets/:walletId/transactions/:transactionId` — soft-delete transaction and reverse wallet balance
- React Query hooks and API client for updating and deleting transactions
- Transaction detail sheet with date, attachment summary, and quick actions
- Edit transaction dialog with Valibot schema validation
- Delete transaction confirmation dialog
- Desktop row menu for edit and delete actions

#### Attachments

- Cloudflare R2 storage for transaction attachments (`apps/ledger-box/src/lib/r2.ts`)
- API route `GET /api/wallets/:walletId/transactions/:transactionId/attachments` — list attachments for a transaction
- API route `POST /api/wallets/:walletId/transactions/:transactionId/attachments` — upload files (PDF, PNG, JPG, JPEG, WEBP; max 10 MB)
- API route `DELETE /api/wallets/:walletId/transactions/:transactionId/attachments/:attachmentId` — permanently remove a file from R2
- Attachments sheet with upload, list, fullscreen preview, and remove actions
- Attachment count and **View** link on the transaction detail dialog
- Shared `TransactionDialogHeader` for transaction detail and attachments dialogs
- Client-side image optimization before upload (resize to 2048px max, JPEG compression)
- Tap an attachment row to open fullscreen preview (images and PDFs)
- Delete attachment confirmation dialog
- File utilities for attachment labels, icons, and preview detection (`apps/ledger-box/src/lib/file.ts`, `image.ts`)
- Cloudflare R2 environment variables in `.env.example`

#### UI package (`@vhnam/ui`)

- `Attachment` and `CurrencyInput` components

#### Tooling

- `@aws-sdk/client-s3` dependency for R2 integration

### Changed

- Transaction list rows open a detail sheet on mobile; desktop shows an inline actions menu
- Dialog and sheet headers use an integrated close button instead of the default floating control

### Setup after merge

```bash
vp install
```

Add Cloudflare R2 credentials to `.env` for attachment upload and preview:

```
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_BUCKET_NAME=
CLOUDFLARE_R2_ACCESS_TOKEN=
CLOUDFLARE_R2_SECRET_ACCESS_TOKEN=
CLOUDFLARE_R2_PUBLIC_URL=
```

### Commits

- `d25386d` feat(wallet): can edit and delete the selected transaction
- `f5687d7` feat(transaction): view attachment
- `baec268` feat(wallet): can CRUD
