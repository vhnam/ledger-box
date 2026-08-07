# mr-23 — Settings route + Account / Appearance UX

**Branch:** `refactor/settings` → `main`

## Summary

Moves user settings out of a sidebar modal into a standalone `/settings` route, then
reshapes Account into a GitHub-style sign-in methods list (with Connect/Disconnect Google
and Delete account) and folds Language into Appearance as a flag-labeled Select — so
settings nav is Account + Appearance only. Also ships supporting bundle and import-order
fixes on the same branch.

## Added

### Settings route

- Authenticated `/settings` layout route mounting `SettingsShellLayout` (desktop
  sub-sidebar, mobile stacked section list, back navigation via history or `/wallets`).
- `/settings` redirects to `/settings/account`; leaf routes for account and appearance
  (locale path retained as a redirect — see below).

### Account — sign-in methods

- GitHub-style **Sign in methods** card:
  - **Email & password** row with verified/unverified badge; **Change password** expands
    inline via `Collapsible`.
  - **Google** row with Connect / Disconnect; disconnect confirms via
    `DisconnectGoogleDialog`.
- Client auth query/mutation wrappers over better-auth: `listAccounts`, `linkSocial`,
  `unlinkAccount`, `deleteUser` (`queries/auth/`).
- `GoogleLogoIcon` on `packages/ui` `Icon` for the Google row.

### Account — delete account

- **Delete account** section: lists owned wallets (links to each wallet’s general
  settings) and blocks delete until none remain; hint copy points at guideline URLs for
  delete/transfer-ownership (transfer remains a future feature).
- When the user owns no wallets, shows a permanent-deletion caution
  (`settings.account.delete.hint`) and enables **Delete your account**.
- `DeleteAccountDialog` with password confirmation before calling better-auth delete.

### Appearance — language

- `SettingsLocalePicker`: Language card on `/settings/appearance` using `@vhnam/ui`
  `Select` with Unicode flag + native-language label per `SupportedLocale`.
- Reuses existing `GET`/`PATCH` `/api/users/locale` (no API/schema change).

### Supporting

- `GUIDELINE_URL` in `apps/ledger-box/src/constants/urls.ts`.
- Lazy message catalog loading in `@vhnam/utils` (`load-messages.ts`) + related
  `LocaleProvider` updates to cut initial i18n bundle cost.
- Root `.oxfmtrc.json` override: finer `#/` import groups for `apps/ledger-box/src`
  (`constants` → `schemas` → `lib` → `queries` → `layouts` → `components` → `modules`).
- Agent skills: `frontend-design`, `web-design-guidelines`; SPDD docs under `docs/spdd/`.

## Changed

- Sidebar user menu **Settings** navigates to `/settings` instead of opening a dialog.
- Settings shell nav: **Account** + **Appearance** only (Language removed from nav).
- Appearance page description covers theme **and** language; theme card grid unchanged.
- `/settings/locale` redirects to `/settings/appearance` (bookmarks/deep links preserved).
- Renamed i18n keys `settings.dialog.tabs.*` → `settings.nav.*` (later drop
  `settings.nav.locale`).
- `Icon` internals adjusted for better tree-shaking / Storybook vitest setup.

## Removed

- `modules/settings/settings-dialog/` (`SettingsDialog`, `SettingsDialogTrigger`).
- Page-shaped `SettingsLocale`; replaced by embeddable `SettingsLocalePicker`.
- `settings.nav.locale` from all 7 locale catalogs.

## i18n

New/updated keys across `en-US`, `en-GB`, `vi-VN`, `fr-FR`, `ja-JP`, `zh-CN`, `zh-TW`
for settings shell, sign-in methods, delete-account section/hint/dialog, broadened
`settings.appearance.description`, and locale picker reuse of `settings.locale.*`.

## Verification

- `vp check` — pass.
- Unit tests pass; browser/Storybook Playwright may require local `npx playwright install`
  if Chromium is missing in the environment.

## Commits

- `19f0c38` refactor(ledger-box): move the Settings Dialog to a new page
- `9d16dba` fix: fix failed tests and decrease bundle sizes
- `a64376a` docs: move spdd into docs
- `da7037c` refactor(ledger-box): update UI for Account Settings
- `4488193` refactor(ledger-box): refactor Appeareance
