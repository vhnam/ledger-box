# mr-22 — per-wallet currency + full app i18n

**Branch:** `feat/i18n` → `main`

## Summary

Adds immutable per-wallet currency (chosen at creation) and end-to-end i18n: locale
preference storage/detection, translated UI across signed-in and public surfaces, coded
API errors, and localized invite emails. Message catalogs are one file per
`SupportedLocale`: `en-US`, `en-GB`, `vi-VN`, `fr-FR`, `ja-JP`, `zh-CN`, `zh-TW`.

## Added

### Per-wallet currency

- Migration `0009_add_wallet_currency`: `wallet.currency` (`text`, not null, default `VND`).
- Supported currency fraction-digit map in `@vhnam/utils` (`VND`/`JPY` 0, `USD`/`EUR` 2).
- Create-wallet UI currency select; wallet DTOs and statement snapshots include `currency`.
- Server helper to validate supported currencies; transfer rejects cross-currency pairs.

### Locale + i18n

- Migration `0010_create_user_settings` + `GET`/`PATCH` `/api/users/locale`.
- `@vhnam/utils` locale helpers: `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`,
  `parseAcceptLanguage`, `toMessageLanguage`, `isSupportedLocale`.
- Message catalogs in
  `packages/utils/src/i18n/messages/{en-US,en-GB,vi-VN,fr-FR,ja-JP,zh-CN,zh-TW}.json`
  covering app chrome, wallets/transactions, wallet settings, auth, public
  invite/statement, validation, toasts, `errors.{CODE}`, and `email.invite.*`.
- Bidirectional catalog key-parity tests (plus en-US/en-GB spelling and zh-CN/zh-TW checks).
- `formatErrorMessage`, shared `api-error-codes` / `apiError` / `ApiErrors`, client
  `getApiError` → `errors.{CODE}`.
- `createServerIntl` + `getUserLocale` for invite-email localization (inviter locale).
- Settings Language tab; signup records locale from `Accept-Language`.

## Changed

- `formatCurrency` / `CurrencyInput` use the wallet’s currency (and viewer locale) instead
  of assuming VND-only formatting; wallet PATCH rejects currency changes;
  statements/seed use each wallet’s currency.
- App chrome, wallets, wallet settings, auth, invite, and public statement pages use
  `FormattedMessage` / `useIntl` / `formatErrorMessage`.
- `LocaleProvider` / `useAppLocale`: signed-in → stored locale; unsigned → browser
  `Accept-Language`. Locale query skipped when there is no session.
- Filter/sort/role constants and Valibot schemas store message ids.
- Date/number formatting is locale-aware (`en-US` vs `en-GB` date order, etc.).
- Netlify app handlers (except better-auth / CSV success) return JSON `{ code, message }`.
- Invite / resend emails localize from the inviter’s `user_settings.locale` (fallback
  `en-US`), reusing `members.role.*` for role copy.
- `AGENTS.md` documents currency, i18n, API error, and invite-email conventions.

## Fixed

- Activity log labels cover `rename`, `invite_resend`, and `invite_email_failed`
  (previously fell through to “Renamed wallet”).
- Storybook `DatePicker` “With Default Value” play: wait for calendar grid visibility
  after opening the popover (avoids racing the open animation).

## Migration / setup

```bash
pnpm --filter @vhnam/ledger-box db:migrate
```

## Commits

- `af0bdec` feat(ledger-box): support currency for wallet
- `678d73d` feat(ledger-box): support i18n
- `7ffdf36` feat(ledger-box): support i18n for wallets/transactions
- `9f9685c` feat(ledger-box): update i18n for wallet settings
- `6a84b24` feat(ledger-box): update i18n for auth
- `a995827` feat(ledger-box): update i18n for api error
- `f8ab4c2` feat(ledger-box): update i18n for email
- `ee160f0` feat(ledger-box): add zh-CN and zh-TW
- `7ba14e1` fix(storybook): fix test for date-picker
