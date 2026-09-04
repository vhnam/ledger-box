# mr-29 — Transaction detail route, wallet module split, locale time zones

## Summary

Transaction details are a dedicated page instead of a sheet. The old `modules/wallets`
folder is split into layouts and feature modules. Dates render in each locale's IANA
time zone rather than the viewer's system clock.

## Added

- Route `GET` UI `/wallets/:walletId/transactions/:transactionId` (`WalletTransactionDetail`).
- `useTransaction` query (list-cache first, then a large list page — there is still no
  get-by-id API).
- `@date-fns/tz` catalog entry; `LOCALE_TIMEZONE` and `getThisWeekRange` in `@vhnam/utils`.
- GitNexus agent skills (`.agents/skills/gitnexus-*`, `.claude/skills/gitnexus-*`, `CLAUDE.md`).
- Catalog keys for transaction-detail errors/back link, activity empty/result counts,
  pagination aria labels, and attachment upload status.

## Changed

- Settings and wallet shells live under `src/layouts/`. Wallet list/actions/dialogs live
  under `modules/wallet-transactions`; attachments and detail under
  `modules/wallet-transaction-detail`.
- `@vhnam/ui` primitives import `cn` from `#/lib/cn`; the app imports `@vhnam/ui/lib/cn`.
  Toast title/description wrap; calendar chevrons use Phosphor directly.
- `formatDate` / `formatDateTime` wrap instants in `TZDate` for the locale's zone
  (`vi-VN` → `Asia/Ho_Chi_Minh`, `en-US` → `America/New_York`, etc.).
- Landing `Card` imports that missed mr-28 now use `@vhnam/ui/components/ui/card`.

## Removed

- Transaction detail sheet and attachments sheet.
- Direct `cn` dependency on `@vhnam/ledger-box`.

## Setup after merge

```bash
vp install
```

No new migrations or environment variables.

## Commits

- `15ef6d4` chore: add GitNexus agent skills
- `0eb6c05` feat(utils): format dates in each locale's IANA time zone
- `a2d05f1` chore(i18n): add transaction-detail, activity, and pagination copy
- `8799260` refactor(ui): import cn via #/lib/cn and tighten calendar, toast, card
- `e070c7a` refactor: import cn from @vhnam/ui and finish landing Card paths
- `8771642` feat: open transaction details on a dedicated route
