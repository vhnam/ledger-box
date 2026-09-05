# mr-31 — Statement attachments, share regenerate, transaction time

## Summary

Shared statements freeze attachment object keys and sign short-lived view URLs on
read/export. Owners can regenerate a share token without creating a new snapshot.
Edit/delete live on the transaction detail page, with an optional time of day and
locale-zone date interpretation.

## Added

- Statement snapshots include per-row attachments (id, key, fileName, contentType,
  size). Public, preview, and export responses resolve keys to presigned GET URLs
  (`@aws-sdk/s3-request-presigner`): 15 minutes on screen, 24 hours in CSV/PDF.
- Public/preview statement UI: row attachment list and shared `AttachmentPreview`.
- CSV attachment-name column; PDF attachment filenames under each row.
- `PATCH /api/wallets/:walletId/statement-shares/:shareId` regenerates the token
  (revoked shares 409 `SHARE_ALREADY_REVOKED`; expired shares get a fresh 90-day
  window). Activity action `regenerate` via migration
  `0011_add_wallet_activity_log_regenerate_action`. Settings row action copies the
  new URL.
- `@vhnam/ui` `TimePicker`; edit-transaction date + time; PATCH accepts
  `occurredTime` (`HH:mm`) and `timezone` (IANA). `resolveEditedOccurredAt` keeps
  the omitted date or time from the existing `occurred_at`.
- `formatInTimeZone` in `@vhnam/utils`; `ClockIcon` on `Icon`.

## Changed

- Edit and delete dialogs move under `wallet-transaction-detail`; list rows no
  longer open those dialogs or show a desktop actions menu.
- Transaction list and detail show locale-zone date and time. Add/transfer date
  pickers write calendar dates with `format(..., 'yyyy-MM-dd')`.
- Statement PDF dates use `formatInTimeZone` and wallet timezone patterns.

## Removed

- `wallet-transaction-menu` and list-row edit/delete entry points.
- Transaction-detail-only `TransactionAttachmentPreview` (replaced by shared
  `AttachmentPreview`).

## Setup after merge

```bash
vp install
pnpm --filter @vhnam/ledger-box db:migrate
```

No new environment variables.
