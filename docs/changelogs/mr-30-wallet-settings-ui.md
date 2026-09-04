# mr-30 — Wallet settings lists, activities route, CodeBlock

## Summary

Wallet settings lists share one layout (cards, skeletons, result counts). The owner
audit trail moves to `/wallets/:walletId/settings/activities` and shows JSON details
in a Shiki `CodeBlock`. Date-range months stay side by side; nested scrollers restore
correctly.

## Added

- `@vhnam/ui` `CodeBlock` (`shiki` catalog) with light/dark themes on `html.dark`,
  plus a Storybook story.
- Route `/wallets/:walletId/settings/activities` (replaces `/settings/activity`).
- Catalog keys for activities copy, members/shares result counts, and shorter share
  description.

## Changed

- Members and statement-share rows use bordered cards, skeleton loading, and the
  same result/pagination chrome as activities.
- Activity detail payloads render in `CodeBlock` instead of a plain dump.
- `DatePickerRange` keeps multiple months in a row (`pagedNavigation`, overflow).
- Negative wallet-summary values use orange instead of rose.
- Router `scrollToTopSelectors` targets `[data-scroll-restoration-id]`.
- `wallet-transaction-detail` files nest under a module folder.
- ASCII hyphen `-` in UI copy, catalogs, tests, and PDF period labels; documented
  in `AGENTS.md`.

## Removed

- `/wallets/:walletId/settings/activity` and `wallet-settings-activity` module
  path.

## Setup after merge

```bash
vp install
```

No new migrations or environment variables.

## Commits

- `eb37422` chore: use ASCII hyphens in copy and document the convention
- `89113e2` feat(ui): add CodeBlock with dual-theme Shiki highlighting
- `1efafdf` fix(ui): keep date-picker-range months in a horizontal row
- `b01b3d1` refactor: nest wallet-transaction-detail like other feature modules
- `6562833` feat: rename wallet settings activity to activities
- `bb932fb` refactor: restyle wallet members and statement-share lists
- `c73f1d0` style: use orange for negative wallet summary values
- `16a33b1` fix: restore scroll position on the wallet shell scroller
