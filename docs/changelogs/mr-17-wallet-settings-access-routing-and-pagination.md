# MR 17 — Wallet Settings Access, Routing & Pagination

**Branches:** `fix/viewer-settings-access`, `refactor/wallet-settings-routes`,
`feat/split-settings` → `main`

### Context

`viewer` is the only non-owner role granted in practice today — owners invite the
money recipient as a Viewer so they can check the wallet themselves. A viewer could
open `/wallets/$walletId/settings` (gear icon or direct URL), which stacked five
sections — general, activity, members, statement-shares, danger-zone — vertically on
one scrollable page.

An audit (`spdd/analysis/GGQPA-XXX-202608011200-Analysis-viewer-settings-access-fix.md`)
read all five backing endpoints directly. **No data-disclosure bug was found** — every
settings-adjacent endpoint already rejected a viewer server-side: `wallet-members.mts`,
`wallet-member.mts`, `wallet-statement-shares.mts`, and `wallet-activity.mts` via
`requireOwnedWallet` (404), and the wallet rename path in `wallet.mts` via
`requireWalletWriteAccess` (403). The actual gap was UI/route-only: the settings page
had no role guard, and the gear icon, danger-zone delete button, members list, and
statement-shares list all rendered unconditionally for a viewer, whose subsequent API
calls then failed. This was a UX/route fix with regression tests, not a security patch.

None of the five sections were individually deep-linkable, and activity's owner-only
rule was expressed only as a conditional render on the parent page, not as a guard on
any URL (there was no URL for activity alone). A follow-up analysis
(`spdd/analysis/GGQPA-XXX-202608011400-Analysis-wallet-settings-per-section-routes.md`)
confirmed all five section components already took `wallet`/`walletId` props sourced
from hooks the parent page already called, so the split could be done purely at the
route layer with zero changes to section internals, actions, or API handlers.

Once each section had its own URL, two gaps remained: **Members** and **Statement
Shares** fetched their entire list in a single request and rendered it all at once —
unlike **Activity**, which already paginated server-side — and neither list is bounded.
Separately, **Danger Zone** was a fifth settings route holding a single destructive
action (delete wallet), disproportionate to its size next to
General/Activity/Members/Statement shares.

### Fixed

#### Route- and navigation-level gating for viewers

- The settings entry point redirects a `viewer` session to `/wallets/$walletId` before
  any settings section renders (now enforced by the shell layout described below, having
  started as a check on the single settings page).
- The settings gear icon/nav entry is hidden for `viewer` role.

Owner and manager settings access is unchanged throughout. Viewer access to
transactions, summary, and attachments on the wallet page is unchanged. No API handler
was modified for this fix — every endpoint was already correctly owner/role-scoped.

### Changed

#### Wallet transactions and settings share one persistent, route-driven shell

- Layout route `routes/_app/wallets/$walletId/route.tsx` (`WalletShellLayout`) owns the
  pending/error/not-found guards, `WalletHeader`, and a persistent left nav with two
  groups — **Wallet** (Transactions) and **Settings** (General, Activity, Members,
  Statement shares) — next to a content pane that renders whichever route is active via
  `<Outlet />`. Both `/wallets/$walletId` (transactions) and every
  `/wallets/$walletId/settings/*` route nest under this one shell, so the section list
  stays visible while browsing transactions, not just inside settings.
- Settings is separately-routed pages under `routes/_app/wallets/$walletId/settings/`:
  `index.tsx` (redirects to `general`) and one leaf per section. Each leaf renders a thin
  route-wrapper component that resolves `wallet`/`walletId` via `useWallet`/`useWallets`
  and renders the section component.
- **Access rules, scoped correctly**: a `viewer` can still reach transactions
  (unaffected), but is redirected to `/wallets/$walletId` if they hit any `/settings/*`
  URL directly. Activity stays owner-only: its route wrapper redirects a non-owner to the
  wallet page, and the nav hides the Activity item entirely for non-owners. Server-side,
  `GET /api/wallets/:walletId/activity` is unchanged — still owner-only via
  `requireOwnedWallet`.
- **Responsive behavior**: on desktop (`md` and up) the nav is a persistent left column,
  grouped under "Wallet" and "Settings" labels. On mobile the same nav items render as a
  single horizontally-scrollable tab strip (`@vhnam/ui`'s `Tabs`, `variant="line"`)
  directly below the wallet header — no group labels, one flat row. The settings gear
  icon that used to link to settings on mobile was removed once the tab strip covered
  that role on every breakpoint.
- Scroll position is preserved per route: the shared `ScrollArea` is given a
  route-specific `scrollRestorationId` (`wallet-main` for transactions,
  `wallet-settings-<section>` for each settings section).

#### Members and Statement Shares now paginate server-side, matching Activity's contract

- `GET /api/wallets/:walletId/members` and `GET /api/wallets/:walletId/statement-shares`
  accept `page`/`pageSize` query params (`page` defaults to 1; `pageSize` defaults to 20,
  clamped to `[1, 100]`) and respond `{ items, total, page, pageSize }` instead of a bare
  array/`{ items }`.
- Members' wallet owner is a synthetic entry (never a `walletMember` row) that always
  sorts first — the endpoint treats it as slot 0 of the _combined_ list rather than
  prepending it to every page, so it appears exactly once, on page 1, and `total`
  (`memberCount + 1`) counts it exactly once regardless of `pageSize`.
- `useWalletMembers`/`useStatementShares` take a `page` argument and include it in their
  query key, so each page caches independently; existing mutation `invalidateQueries`
  calls (unchanged, key-prefix only) continue to invalidate every cached page.
- No client-side slicing anywhere — both sections render exactly the page the server
  returned.

#### One shared pagination component and utility, used by all four paginated lists

- `getPageItems`/`PageItem` (windowed page-number list with ellipsis), originally
  Transactions-only, moved to `src/lib/pagination.ts`.
- The Transactions-only `WalletPagination` was generalized into
  `src/components/app-pagination.tsx` (`AppPagination`) — same props, no wallet-specific
  naming.
- Members, Statement Shares, Activity, and Transactions all render the same
  `AppPagination` (Previous / numbered pages with ellipsis / Next).

#### Danger Zone merged into General

- `WalletSettingsDangerZone`, its route wrapper, and the
  `/wallets/$walletId/settings/danger-zone` route were deleted outright — not
  redirected. A stale link to that URL now 404s.
- `WalletSettingsGeneral` renders the delete-wallet action (`DeleteWalletDialog`) as a
  second, GitHub-styled section on the same page: page title with a bottom border, a
  "Wallet name" subsection with the Save button inline next to the field, then a
  `border-destructive`-bordered "Danger Zone" card containing the delete row. No change
  to the delete-wallet mutation, its confirmation dialog, or the name-update form's
  validation/toast behavior.
- Settings nav is four sections (General, Activity, Members, Statement shares), not
  five.

#### Documentation

- `AGENTS.md` — corrected the stale "Known gap" paragraph in the tenancy-scoping
  section: member read access is implemented via `requireWalletAccess` /
  `findAccessibleWallets`, and wallet settings are gated to non-viewer roles at the
  route.

**No changes**, across all three efforts, to any section component's data logic
(`WalletSettingsActivity`, `WalletSettingsMembers`'s invite/role/revoke flows,
`WalletSettingsStatementShares`'s create/preview/download/revoke flows), or to any
Netlify function authorization (`tenant-access.ts`).

### Added

- `netlify/functions/lib/tenant-access.test.ts` — `requireOwnedWallet` coverage
  confirming an active viewer member and an active manager member are both denied with
  404 (strict-owner check, independent of `wallet_member` role), and the owner is
  granted.
- `GET /api/wallets/:walletId/members` and `GET /api/wallets/:walletId/statement-shares`
  pagination support (see Changed above).
- Shared `AppPagination` component (`#/components/app-pagination.tsx`) and
  `getPageItems` utility (`#/lib/pagination.ts`).
- SPDD analysis/prompt docs for each stage of this work under `spdd/analysis/` and
  `spdd/prompt/`.

### Removed

- `src/modules/wallets/wallet-settings-page/` and `src/modules/wallets/wallet-settings-layout/`
  (superseded by `wallet-shell-layout/`).
- `src/modules/wallet-settings/wallet-settings-danger-zone/` (component, route wrapper,
  barrel) and `src/routes/_app/wallets/$walletId/settings/danger-zone.tsx`.
- `src/modules/wallets/wallet-transactions/wallet-pagination.tsx` (superseded by
  `src/components/app-pagination.tsx`).

### Setup after merge

```bash
vp install
vp check   # route tree regenerates without the danger-zone route
vp test    # includes the tenant-access viewer/manager rejection tests
```

No migrations, no new environment variables, no API breaking changes for existing
Members/Statement Shares callers that don't pass `page`/`pageSize` (both endpoints
default to page 1).

### Commits

- `8e1f229` fix(ledger-box): Fix Viewer access to wallet settings
- `75ea755` feat(ledger-box): split wallet settings
- `17a92d2` feat(ledger-box): add pagination for Wallet Settings
