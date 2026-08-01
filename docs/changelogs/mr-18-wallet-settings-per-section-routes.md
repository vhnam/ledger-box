# MR 18 — Wallet Settings Per-Section Routes

**Branch:** `refactor/wallet-settings-routes` → `main`

### Context

Wallet settings (`routes/_app/wallets/$walletId/settings.tsx`) stacked five sections —
general, activity, members, statement shares, danger zone — vertically on one
scrollable page. None of the sections were individually deep-linkable, and activity's
owner-only rule was expressed only as a conditional render in the parent page, not as a
guard on any URL (there was no URL for activity alone).

An analysis (`spdd/analysis/GGQPA-XXX-202608011400-Analysis-wallet-settings-per-section-routes.md`)
confirmed all five section components already took `wallet`/`walletId` props sourced
from hooks the parent page already called, so the split could be done purely at the
route layer with zero changes to section internals, actions, or API handlers.

### Changed

#### The wallet and its settings now share one persistent shell

- New layout route `routes/_app/wallets/$walletId/route.tsx` (`WalletShellLayout`)
  replaces the previous split between `WalletPage`'s own header and a separate
  settings-only layout. It owns the pending/error/not-found guards, `WalletHeader`, and
  a persistent left nav with two groups — **Wallet** (Transactions) and **Settings**
  (General, Activity, Members, Statement shares, Danger zone) — next to a content pane
  that renders whichever route is active via `<Outlet />`. Both `/wallets/$walletId`
  (transactions) and every `/wallets/$walletId/settings/*` route now nest under this one
  shell, so the section list stays visible while browsing transactions, not just inside
  settings.
- Settings is five separately-routed pages under `routes/_app/wallets/$walletId/settings/`:
  `index.tsx` (redirects to `general`) and one leaf per section (`general.tsx`,
  `activity.tsx`, `members.tsx`, `statement-shares.tsx`, `danger-zone.tsx`). Each leaf
  renders a thin route-wrapper component (`WalletSettingsGeneralRoute`,
  `WalletSettingsMembersRoute`, `WalletSettingsStatementSharesRoute`,
  `WalletSettingsDangerZoneRoute`, `WalletSettingsActivityRoute`) that resolves
  `wallet`/`walletId` via the same `useWallet`/`useWallets` hooks used throughout, and
  renders the existing, **completely unmodified** section component.
- **Access rules, unchanged from MR 17, now scoped correctly**: a `viewer` can still
  reach transactions (unaffected), but is redirected to `/wallets/$walletId` if they hit
  any `/settings/*` URL directly. Activity stays owner-only: `WalletSettingsActivityRoute`
  redirects a non-owner to the wallet page. The Settings nav group is hidden entirely
  for a viewer. Server-side, `GET /api/wallets/:walletId/activity` is unchanged —
  still owner-only via `requireOwnedWallet`.
- **Responsive behavior**: on desktop (`md` and up) the nav is a persistent left column,
  grouped under "Wallet" and "Settings" labels, next to the content pane. On mobile the
  same nav items render as a single horizontally-scrollable tab strip
  (`@vhnam/ui`'s `Tabs`, `variant="line"`) directly below the wallet header — no group
  labels, one flat row — so every section is reachable on mobile the same way as
  desktop, without a separate "list vs. detail" screen. The `WalletActions` gear icon
  that used to link to settings on mobile is removed; it's now fully redundant since the
  tab strip covers that role on every breakpoint.
- Scroll position resets between routes: the shared `ScrollArea` is keyed and given a
  route-specific `scrollRestorationId` (`wallet-main` for transactions,
  `wallet-settings-<section>` for each settings section) instead of one ID per page.

**No changes** to `WalletSettingsGeneral`, `WalletSettingsActivity`,
`WalletSettingsMembers`, `WalletSettingsStatementShares`, `WalletSettingsDangerZone`,
`WalletTransactions`, `WalletSummary`, their `.actions.tsx` files, or any Netlify
function handler. `WalletActions` lost its settings gear icon and the `role` prop that
gated it (both now unused, since the nav/tab strip replaces that entry point). **No
Storybook stories existed for any of these components before this change**, so the
"update stories if props change" step had nothing to update.

### Removed

- `src/modules/wallets/wallet-settings-page/` and `src/modules/wallets/wallet-settings-layout/`
  (both superseded by `wallet-shell-layout/`).

### Setup after merge

```bash
vp install
vp check   # route tree regenerates from the new file structure
vp test
```

No migrations, no new environment variables, no API changes.
