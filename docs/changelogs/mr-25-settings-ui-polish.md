# mr-25 — Settings/wallet-settings card polish, mobile nav dropdown, theme fade

**Branch:** `feat/settings-ui-polish` → `main`

## Summary

Polishes the Settings and Wallet Settings surfaces onto a consistent `Card`-based
layout, replaces the two-state mobile settings nav (back-link + full section list)
with a single persistent section dropdown, adds a native View-Transitions crossfade
when switching light/dark/system theme, exposes the app sidebar trigger on mobile
headers that previously lacked one, and prunes unused `@vhnam/ui` components.

## Added

### Animated theme switching

- `#/lib/theme/theme-transition.ts` (+ barrel `#/lib/theme/index.ts`):
  `switchThemeWithTransition` wraps `setTheme` in `document.startViewTransition` +
  `flushSync` when supported and `prefers-reduced-motion` is not set, otherwise
  falls back to an instant `setTheme`. Exposes `canUseViewTransition`,
  `prefersReducedMotion`, `THEME_TRANSITION_MS` (350ms), and the canonical
  `AppTheme` type. Unit tests stub `window`/`document` globals.
- `style.css`: `@supports (view-transition-name: none)` crossfade on
  `::view-transition-old(root)` / `::view-transition-new(root)`, disabled under
  `@media (prefers-reduced-motion: reduce)`.

### Mobile settings nav dropdown

- `SettingsShellLayout` mobile bar now renders a `DropdownMenu` showing the active
  section (icon + label) with the other sections as menu items, replacing the old
  `SettingsBackLink` / `SettingsMobileList` two-state pattern.
- `/settings` now redirects to `/settings/account` unconditionally (desktop and
  mobile alike) — the mobile-only `matchMedia` viewport gate is removed.

### Mobile sidebar reachability

- `WalletHeader` and `SettingsHeader` each gain a mobile-only (`md:hidden`)
  `SidebarTrigger`, previously unreachable from those headers.

## Changed

- **Card-based section layout**: `WalletSettingsGeneral` (name / currency /
  danger-zone), `WalletSettingsMembers` (invite / member-list),
  `WalletSettingsActivity`, `WalletSettingsStatementShares`, and `SettingsAccount`'s
  delete-account section now each render as `Card`/`CardHeader`/`CardTitle`/
  `CardContent` blocks instead of ad-hoc divs with manual headings and
  `Separator`/`Alert` usage.
- Settings/wallet-settings screen headings standardized to `text-2xl` with
  `border-b pb-4`, outer wrapper `flex flex-col gap-8` (up from `text-xl`/`gap-6`).
- `SettingsAppearance`: locale picker now renders above the theme-option grid
  (previously below); theme grid is `grid md:grid-cols-3` (single column on
  mobile); selecting a theme routes through `switchThemeWithTransition` with a
  no-op guard when re-selecting the active theme.
- `AppSidebar`'s own `SidebarTrigger` is now hidden on mobile entirely
  (`hidden md:block`), since mobile sidebar access moved to the per-header
  triggers above.
- `SectionShellLayout` mobile-bar wrapper: added `shrink-0`, padding `px-2` → `px-4`.

## Removed

- `@vhnam/ui` `Alert`/`AlertAction`/`AlertDescription`/`AlertTitle` and `Tabs` family
  components, plus their Storybook stories — no remaining consumers in the app.
- `SettingsBackLink`, `SettingsMobileList`, and the `isMobileListVisible` mobile-nav
  state from `SettingsShellLayout`.
- `SettingsAccount`'s email verification `Badge` (Verified/Unverified) — email now
  renders as plain text. **Flagged for confirmation**: this is a behavior change,
  not purely presentational; restore if unintentional.

## Design system

- Standardized `ring-[3px]` arbitrary-value usage to Tailwind's built-in `ring-3`
  across `badge.tsx`, `calendar.tsx`, `scroll-area.tsx`, `toast.tsx`, `toggle.tsx`.
- Documented design-system conventions (incl. the `ring-3` rule) in `AGENTS.md`.

## Verification

- `theme-transition.test.ts`: covers `canUseViewTransition` (reduced-motion /
  unsupported branches) and `switchThemeWithTransition` (transition vs. fallback
  path).
- Manual check recommended: repo-wide grep for `components/alert` and
  `components/tabs` imports before merge, in case another in-flight branch still
  depends on the removed components.

## Commits

- `8b5d06e` feat(ledger-box): polish settings cards, mobile nav, and theme fade
- `35760b2` chore(ui): prune unused components, dedupe ring-[3px] to ring-3, document design-system rules
- `0324e1a` refactor(ledger-box): restructure wallet settings and account screens onto card layout
