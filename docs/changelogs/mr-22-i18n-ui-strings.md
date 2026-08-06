# mr-22 — i18n UI strings (app chrome, wallets, wallet settings)

## Summary

Extends the existing locale / `react-intl` infrastructure beyond Settings so the signed-in
app — shell, wallets/transactions, and wallet settings — renders translated copy for `en`,
`vi`, `fr`, and `ja` (with `en-US`/`en-GB` sharing the English catalog).

## Added

- Message keys in `packages/utils/src/i18n/messages/{en,vi,fr,ja}.json` covering:
  - common actions, nav, wallet shell, empty states, summary, filters/sort
  - create/delete wallet, transaction CRUD, transfers, attachments
  - wallet settings (general, members, statement shares, activity)
  - member roles, activity actions/entities, statement snapshot preview
  - validation (including member/share/password) and related toasts
- Bidirectional catalog key-parity tests in `packages/utils/src/i18n/messages.test.ts`.
- `apps/ledger-box/src/lib/intl-message.ts` (`formatErrorMessage`) to translate Valibot
  message ids while passing through raw English API error bodies.

## Changed

- App chrome, wallet shell/header/page, wallets module, and wallet settings modules use
  `FormattedMessage` / `useIntl` / `formatErrorMessage`.
- Filter/sort and member-role option constants use `labelId` + `defaultLabel` (role options
  also carry description ids; email template and public invite page updated to the new shape).
- Valibot schemas for wallets/transactions/transfer, members, statement shares, and change
  password store message ids.
- Statement snapshot view copy is localized (settings preview and public page).
- Settings account password toast/errors use catalog messages.
- `AGENTS.md` documents the react-intl / catalog conventions.

## Fixed

- Activity log labels cover all actions including `rename`, `invite_resend`, and
  `invite_email_failed` (previously fell through to “Renamed wallet”).

## Out of scope (follow-ups)

- Auth and remaining public invite/statement page chrome
- API error codes + localized server responses
- Invite email body localization (inviter locale)
