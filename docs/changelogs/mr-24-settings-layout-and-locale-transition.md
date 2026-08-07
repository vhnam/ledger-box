# mr-24 — Settings section shell + locale-change fade

**Branch:** `refactor/settings-layout` → `main`

## Summary

Aligns `/settings` with the wallet two-panel chrome (shared `SectionShellLayout`,
desktop header + sub-sidebar, mobile list → drill → back), adds a full-screen fade
when changing language so the mid-switch UI is masked, and reorganizes
`apps/ledger-box` `lib` / `utils` into domain folders with barrel exports — including
an auth-barrel fix so server `auth` cannot leak into the client bundle.

## Added

### Shared section shell

- `SectionShellLayout` (`layouts/section-shell-layout/`): shared two-panel chrome
  (optional header/toolbar, desktop sidebar, mobile bar, scrollable content). Used by
  both settings and wallet shells.
- `SettingsHeader`: page title chrome mirroring wallet header height / border /
  `bg-sidebar`.
- Mobile settings landing: bare `/settings` shows the Account / Appearance list;
  desktop auto-lands `/settings` → `/settings/account` (viewport-gated so mobile is
  not redirected).
- `UserCircleIcon` on `@vhnam/ui` `Icon`; i18n `settings.page.title` /
  `settings.page.navLabel`.

### Locale-change fade transition

- `LocaleTransitionProvider` + reducer (`lib/locale/locale-transition.tsx`): phases
  `idle` → `covering` → `ready` → `revealing`; single-flight begins; fail / 5s cover
  timeout clears the veil.
- `LocaleChangeOverlay`: full-viewport `bg-background` fade; blocks pointer events
  while covering; respects `prefers-reduced-motion` (shorter min cover).
- `SettingsLocalePicker` calls `beginLocaleTransition` before the locale PATCH so the
  overlay masks catalog swap.
- Catalog key `settings.locale.changing` (screen-reader status while covered).
- Unit tests for the reducer / timing helpers.

### Lib / utils domain folders

- Grouped under `lib/`: `api-error`, `auth`, `locale`, `storage`, `wallet` (plus
  existing `db`).
- Pure helpers moved to `utils/`: `api-error` codes, `attachments`, `avatar`,
  `locale` (client-locale), `pagination`, `wallet` (period-bounds, share-token,
  statement-export).
- Barrel `index.ts` per domain; Netlify handlers and app imports updated to `#/…`
  paths.
- Added unit coverage for several moved modules (`auth-client`, `intl-message`,
  `r2`, `statement`, `wallet-summary`, attachments, avatar, pagination, etc.).

## Changed

- `SettingsShellLayout` and `WalletShellLayout` compose `SectionShellLayout` instead
  of duplicating the two-column layout markup.
- App sidebar secondary / user menu adjusted for the settings shell chrome.
- Account “owned wallets” links go to `/wallets/$walletId/settings/general` (not the
  wallet overview).
- Oxfmt `#/` import groups extended for the new `utils` path.
- `apps/ledger-box/README.md` notes updated for the layout/lib structure.

## Fixed

- `#/lib/auth` barrel re-exports **only** the browser-safe client (`authClient`,
  `signIn` / `signUp` / `signOut`, `useSession`). Server `auth` must be imported from
  `#/lib/auth/auth` in Netlify handlers so a mistaken barrel import cannot pull `pg`
  Pool / secrets into the Vite bundle.

## i18n

New keys across `en-US`, `en-GB`, `vi-VN`, `fr-FR`, `ja-JP`, `zh-CN`, `zh-TW`:

- `settings.page.title`, `settings.page.navLabel`
- `settings.locale.changing`

## Verification

- `vp check` / unit tests for locale transition and moved modules.

## Commits

- `821af4c` feat(ledger-box): add animation when changing locale
- `31c6f3d` refactor(ledger-box): refactor lib and utils
- `c41b770` chore(ledger-box): update README.md
- `123454b` refactor(ledger-box): update layout
- `fe27e71` docs: update GGQPA-XXX-202608080208-[Refactor]-ui-app-settings-layout
- `b7aada7` fix(ledger-box): fix footgun
