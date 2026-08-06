# mr-23 — user settings dialog to standalone `/settings` route

**Branch:** `feat/user-settings-route` → `main`

## Summary

Moves user settings (Account, Appearance, Language) out of a modal dialog and into a
standalone, deep-linkable route tree at `/settings`, mirroring the layout-route pattern
already used for `/wallets/$walletId/settings/`. This is a routing/layout-only change —
no section's form, mutation, or query logic was touched.

## Added

- `routes/_app/settings/route.tsx`: new authenticated layout route mounting
  `SettingsShellLayout`.
- `routes/_app/settings/index.tsx`: redirects `/settings` → `/settings/account`.
- `routes/_app/settings/{account,appearance,locale}.tsx`: leaf routes rendering the
  existing `SettingsAccount`, `SettingsAppearance`, `SettingsLocale` components
  unchanged.
- `modules/settings/settings-shell-layout/`: new shell component providing a desktop
  sub-sidebar (Account/Appearance/Language) with active-section highlighting, back
  navigation, and a mobile-specific stacked section list (distinct from the wallet
  settings mobile dropdown, per design — a native-settings-app-style tap-through list).
  Back navigation uses `router.history.back()` when a prior in-app entry exists, falling
  back to `/wallets` otherwise.
- New i18n message ids across all 7 locale catalogs: `settings.page.title`,
  `settings.back`, `settings.nav.{account,appearance,locale}`.

## Changed

- `layouts/app-layout/app-sidebar-user.tsx`: the sidebar user menu's "Settings" entry
  now navigates to `/settings` (a `Link`) instead of opening a dialog; removed the local
  `settingsOpen` state.
- Renamed i18n keys `settings.dialog.tabs.{account,appearance,locale}` →
  `settings.nav.{account,appearance,locale}` across all 7 locale files (values
  unchanged) to reflect that they now label routes, not dialog tabs.

## Removed

- `modules/settings/settings-dialog/` (`SettingsDialog`, `SettingsDialogTrigger`) —
  fully replaced by the route-based shell; no remaining consumers.

## UX notes

- No dialog-coupled behavior needed replicating: none of the three section components
  relied on dialog-provided auto-focus, and none closed-on-save (the account password
  form only toasts and resets). The only dialog behavior replaced is the default `X`
  dismiss, now covered by explicit back navigation.
- No `packages/ui` component's public API changed, so no Storybook story updates were
  required.

## Verification

- `vp check` — pass (348 files, no lint/type/format issues).
- `vp test run` — pass (40 files, 159 tests).
