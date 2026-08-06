# mr-22 — i18n Phase 1: app chrome + wallets/transactions UI strings

## Summary

Extends the existing locale / `react-intl` infrastructure beyond Settings so the signed-in
app shell and wallets/transactions flows render translated copy for `en`, `vi`, `fr`, and
`ja` (with `en-US`/`en-GB` sharing the English catalog).

## Added

- Phase 1 message keys in `packages/utils/src/i18n/messages/{en,vi,fr,ja}.json` covering
  common actions, nav, wallet shell, empty states, summary, filters/sort, create/delete
  wallet, transaction CRUD, transfers, attachments, validation, and related toasts.
- Bidirectional catalog key-parity tests in `packages/utils/src/i18n/messages.test.ts`.
- `apps/ledger-box/src/lib/intl-message.ts` (`formatErrorMessage`) to translate Valibot
  message ids while passing through raw English API error bodies.

## Changed

- App chrome (`app-sidebar*`), wallet shell/header/page, and all Phase 1 wallet module UI
  now use `FormattedMessage` / `useIntl`.
- Filter/sort option constants use `labelId` + `defaultLabel` instead of hardcoded labels.
- Phase 1 Valibot schemas (`add-transaction`, `edit-transaction`, `transfer-money`,
  `wallet`) store message ids; field errors go through `formatErrorMessage`.
- Wallet/transaction toast titles and client fallbacks use `formatMessage`.
- `AGENTS.md` documents the react-intl / catalog conventions.

## Out of scope (follow-ups)

- Wallet settings (members, statement shares, activity, general)
- Auth and public invite/statement pages
- API error codes + localized server responses
- Invite email localization (inviter locale)
