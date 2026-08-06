# mr-22 — full app i18n (UI, API errors, invite emails)

## Summary

Extends the existing locale / `react-intl` infrastructure so Ledger Box renders translated
copy for `en`, `vi`, `fr`, and `ja` (with `en-US`/`en-GB` sharing the English catalog)
across the signed-in app and unauthenticated auth/invite/statement surfaces, returns
stable API error codes the client maps to catalog messages, and localizes wallet invite
emails using the inviter’s stored locale.

## Added

- Message keys in `packages/utils/src/i18n/messages/{en,vi,fr,ja}.json` covering:
  - common actions, nav, wallet shell, empty states, summary, filters/sort
  - create/delete wallet, transaction CRUD, transfers, attachments
  - wallet settings (general, members, statement shares, activity)
  - member roles, activity actions/entities, statement snapshot preview
  - auth login/register, public invite, public statement chrome
  - validation (including member/share/password/auth) and related toasts
  - `errors.{CODE}` for every Netlify API error code
  - `email.invite.*` for wallet invite subject/body/CTA
- Bidirectional catalog key-parity tests in `packages/utils/src/i18n/messages.test.ts`.
- `apps/ledger-box/src/lib/intl-message.ts` (`formatErrorMessage`) to translate Valibot /
  API message ids while passing through unknown English strings.
- `apps/ledger-box/src/lib/api-error-codes.ts` + `netlify/functions/lib/api-error-response.ts`:
  shared codes and `apiError()` / `ApiErrors` JSON `{ code, message }` responses.
- `getApiError` / updated `getApiErrorMessage` parse `{ code, message }` and return
  `errors.{CODE}` catalog ids for `formatErrorMessage`.
- `toMessageLanguage` / `isSupportedLocale` helpers in `@vhnam/utils`.
- `netlify/functions/lib/server-intl.ts` (`createServerIntl`) and
  `netlify/functions/lib/user-locale.ts` (`getUserLocale`) for send-time email locale.

## Changed

- App chrome, wallets, wallet settings, auth, invite, and public statement pages use
  `FormattedMessage` / `useIntl` / `formatErrorMessage`.
- `LocaleProvider` / `useAppLocale` use the signed-in stored locale when available, otherwise
  the browser Accept-Language via `resolveClientLocale` (public/auth routes). Signed-in
  locale query is skipped when there is no session.
- Filter/sort and member-role option constants use `labelId` + `defaultLabel` (role options
  also carry description ids).
- Valibot schemas for wallets/transactions/transfer, members, statement shares, auth, and
  change password store message ids.
- Netlify app handlers (except better-auth / CSV success bodies) return JSON error bodies
  with stable codes; query-layer fallbacks use catalog ids.
- Wallet invite / resend emails localize subject and body from the inviter’s
  `user_settings.locale` (fallback `en-US`), reusing `members.role.*` for role copy.
- Statement snapshot formatting uses `useAppLocale` so messages and number/date formats align.
- Settings account password toast/errors use catalog messages.
- `AGENTS.md` documents the react-intl / catalog / API error / invite-email conventions.

## Fixed

- Activity log labels cover all actions including `rename`, `invite_resend`, and
  `invite_email_failed` (previously fell through to “Renamed wallet”).
