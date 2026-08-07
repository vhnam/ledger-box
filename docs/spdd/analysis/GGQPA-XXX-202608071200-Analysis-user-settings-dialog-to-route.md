# SPDD Analysis: User Settings Dialog to Standalone `/settings` Route

## Original Business Requirement

Move user settings from a dialog with tabs to a standalone route at `/settings`, mirroring
the pattern already used for wallet settings. Read `AGENTS.md` first.

Current state: user settings render as a dialog opened from the sidebar user menu, with
Account, Appearance, and Language tabs inside it (see attached screenshot — dark theme,
tab list on the left inside the dialog).

## Task

1. Add `routes/_app/settings/` as a layout route with a sub-sidebar (Account, Appearance,
   Language) and an `<Outlet />`, following the same structure used for
   `_app/wallets/$walletId/settings/`.
2. Add child routes for each section, moving the existing section components in
   unchanged — do not touch their internals, actions, or mutations, only where they're
   mounted.
3. Redirect `/settings` to `/settings/account`.
4. Replace the dialog's close (X) button with back navigation to wherever the user was
   before opening settings — this is now a page, not an overlay.
5. Update the sidebar user menu entry to navigate to `/settings` instead of opening the
   dialog.

## Mobile

The current dialog's tab sidebar does not translate to mobile. Design a stacked variant:
a scrollable list of section entries on `/settings`, each navigating to its own route on
tap, similar to a native settings app. Do not attempt to fit the desktop sub-sidebar into
a mobile-width layout.

## Constraints

- This is a routing and layout change. Do not modify what each section does — account
  form, appearance/theme picker, and the language selector (once it exists) keep their
  existing logic.
- Preserve deep-linkability: each section gets a stable URL.
- Update Storybook stories for any component whose mount point or props change.
- Verify with `vp check && vp test`.
- Write the per-merge changelog and update the root `CHANGELOG.md`.

Report any UX behavior tied to the dialog form (e.g. auto-focus, close-on-save) that needs
an equivalent on a page before removing the dialog.

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **User settings sections** (`apps/ledger-box/src/modules/settings/`): three independent,
  self-contained presentational modules — `settings-account` (Formisch + Valibot password
  change form, `settings-account.actions.tsx`), `settings-appearance` (theme picker via
  `@vhnam/ui`'s `useTheme`), `settings-locale` (locale picker backed by
  `useUserLocale`/`useUpdateUserLocale` TanStack Query hooks against `/api/users/locale`).
  Each renders its own heading/description and owns its full width — none of them assume
  they're inside a `Tabs`/`TabsContent` wrapper, so they are already route-shaped.
- **`SettingsDialog` / `SettingsDialogTrigger`** (`modules/settings/settings-dialog/`): the
  container being removed. `SettingsDialogTrigger` is a `DropdownMenuItem` rendered inside
  `AppSidebarUser`'s dropdown; `SettingsDialog` wraps a shadcn `Dialog` + `Tabs` around the
  three section components. Dialog open state is local `useState` in `AppSidebarUser`.
- **`AppSidebarUser`** (`layouts/app-layout/app-sidebar-user.tsx`): owns the
  `settingsOpen` state and renders both the trigger and the dialog. This is the mount
  point that needs its dialog wiring replaced with navigation.
- **Wallet settings precedent** (`_app/wallets/$walletId/settings/`, and its layout
  component `WalletShellLayout` in `modules/wallets/wallet-shell-layout/`): the pattern
  to mirror. A parent `route.tsx` on `/wallets/$walletId` mounts a shell component that
  renders a persistent header, a desktop sub-sidebar (`Button` + `Link` list keyed off
  `pathname` segment matching), a **different** mobile treatment (a `DropdownMenu` in a
  slim sub-header, not a stacked list), and an `<Outlet />` inside a `ScrollArea`. Each
  settings section is its own file route (`general.tsx`, `activity.tsx`,
  `members.tsx`, `statement-shares.tsx`) whose `RouteComponent` does nothing but read
  route params and render a `*-route.tsx` wrapper component from
  `modules/wallet-settings/*`. An `index.tsx` under `settings/` does
  `beforeLoad: () => redirect(...)` to the first section — this is the exact mechanism
  needed for `/settings` → `/settings/account`.
  A prior analysis of this exact pattern exists at
  `spdd/analysis/GGQPA-XXX-202608011400-Analysis-wallet-settings-per-section-routes.md`
  and its implementation record at
  `docs/changelogs/` (see `[Refactor]-route-wallet-settings-per-section.md`) — worth
  reading as prior art before REASONS Canvas, since it already resolved several of the
  same design questions (route file layout, redirect mechanism, active-section
  highlighting) for this codebase.
- **TanStack Router file-based routing** (`routes/_app/route.tsx` → `AppLayout` →
  `<Outlet />` → `SidebarInset`): `/_app` is an authenticated layout route
  (`beforeLoad` redirects to `/auth/login` without a session). A new `/_app/settings`
  layout route sits as a sibling to `/_app/wallets`, both authenticated the same way —
  no new auth logic needed.
- **`--header-height` / `--sub-header-height` CSS custom properties**
  (`style.css`, used throughout `wallet-shell-layout.tsx` and `wallet-header.tsx`): the
  layout rhythm (fixed header, `calc(100vh - header)` body, `md:hidden` mobile
  sub-header) that a new settings shell should reuse for visual consistency with the
  rest of the app shell, rather than reinventing spacing.
- **Dialog's built-in close affordance** (`packages/ui/src/components/dialog.tsx`):
  `DialogContent` renders a `DialogClose` with an `XIcon` automatically — this is framework
  chrome, not something `SettingsDialog` implemented itself. There is currently no
  custom "back" or "close" logic in the settings dialog beyond this default X.
- **Back-navigation precedent**: `ArrowLeftIcon` is already used for in-app "step back"
  affordances in `wallet-transaction-dialog-header.tsx` and
  `wallet-edit-transaction-dialog.tsx` (both still dialog-internal steppers, not
  route-level back nav). No existing code calls `router.history.back()` or similar —
  this will be a new pattern in the codebase, not a reuse of an existing one.

#### New Concepts Required

- **`/settings` layout route** (`routes/_app/settings/route.tsx` or `index at
route.tsx`): mounts a new shell component (name TBD in REASONS Canvas, e.g.
  `SettingsShellLayout`) analogous to `WalletShellLayout`, but simpler — no async
  wallet fetch, no role-based section visibility, no owner-only gating. Just a static
  list of three sections.
- **`/settings/account`, `/settings/appearance`, `/settings/locale` (or `/language`)
  child routes**: thin `RouteComponent`s that render the existing `SettingsAccount`,
  `SettingsAppearance`, `SettingsLocale` components unchanged, mirroring how
  `general.tsx` renders `WalletSettingsGeneralRoute`.
- **`/settings/` index redirect route**: `beforeLoad` redirect to
  `/settings/account`, mirroring `wallets/$walletId/settings/index.tsx`.
- **Settings back-navigation target**: since `/settings` is reached only from the
  sidebar user menu (available on every authenticated page), "back to wherever the
  user was" has no `walletId`/parent-route anchor the way wallet settings has
  `/wallets/$walletId`. This needs an explicit strategy (browser history back vs. a
  fixed fallback route) — flagged in Risk & Gap Analysis below.
- **Mobile stacked settings list**: a new UI shape not yet present anywhere in this
  codebase — wallet settings' mobile treatment is a dropdown-in-sub-header, not a
  scrollable stacked list. This is a genuinely new mobile pattern, not a copy of the
  wallet precedent, per the explicit instruction: "Do not attempt to fit the desktop
  sub-sidebar into a mobile-width layout."

#### Key Business Rules

- **No section's internals change** — `SettingsAccount`'s Formisch form/mutation,
  `SettingsAppearance`'s `useTheme` wiring, and `SettingsLocale`'s
  `useUserLocale`/`useUpdateUserLocale` queries must be imported and rendered exactly as
  they are today. This governs the three existing modules.
- **Deep-linkability** — each section must resolve from a direct URL hit (page reload,
  shared link), not just from in-app navigation. Governs the new child routes; the
  `beforeLoad` redirect pattern already satisfies this for the index route.
- **Tenancy/auth scoping is inherited, not reimplemented** — `/settings` sits under
  `/_app`, which already gates on session via `beforeLoad`. No new auth check is needed
  (this is user-level settings, not wallet/tenant data, so `tenant-access.ts` helpers are
  out of scope entirely — this is a pure client-routing change with an existing
  `/api/users/locale` endpoint already tenant/user-scoped server-side).
- **No categories/tags rule (AGENTS.md)** — not implicated; this task touches no
  transaction data.

## Strategic Approach

#### Solution Direction

Mirror the wallet-settings shell pattern at a smaller scale: a TanStack Router layout
route (`_app/settings`) renders a new shell component with a static (non-async, non-role-
gated) desktop sub-sidebar of three `Link`s plus an `<Outlet />`, while three leaf file
routes each mount one existing settings module unchanged. `/settings/` redirects to
`/settings/account` via `beforeLoad`, exactly as `wallets/$walletId/settings/index.tsx`
does. `AppSidebarUser` drops its `useState`/`SettingsDialog` wiring in favor of a `Link`
(or `navigate()`) to `/settings` on the existing dropdown item, and `SettingsDialog`/
`SettingsDialogTrigger` are deleted once nothing references them. Mobile gets a distinct,
new stacked-list view (not adapted from wallet settings' mobile dropdown), rendered at
the `/settings` index level or conditionally in the shell based on viewport.

#### Key Design Decisions

- **Where the mobile/desktop split happens**: option A — one shell component with
  responsive CSS (sidebar `hidden md:flex`, a new stacked list `flex md:hidden`),
  matching how `WalletShellLayout` already conditionally renders a `md:hidden` mobile
  sub-header inside the same component. Option B — two separate components. →
  **Recommend option A** for consistency with the existing wallet-settings precedent and
  to avoid duplicating the section list (icon/label/route) in two places; the existing
  file already proves this responsive-single-component approach works at this exact
  layout tier.
- **Back-navigation mechanism**: option A — `router.history.back()` (browser-history
  based, correct "wherever you were" semantics but fragile if `/settings` is opened in a
  new tab or as the first navigation). Option B — a fixed fallback link (e.g. always to
  `/wallets`). Option C — hybrid: attempt history back, fall back to a fixed route if
  there's no in-app history entry. → **Recommend option C**, flagged as an open question
  for REASONS Canvas since it's the one place this task has no existing in-repo pattern
  to copy (see Risk & Gap Analysis).
  Existing task 4 ("wherever the user was before opening settings") also has a
  documentation/UX question, called out in Risks: the current dialog does not lose the
  underlying page (it stays mounted behind the overlay), so "back" from a dialog was
  free; a route now has to explicitly re-derive that destination.
- **Route action file layout**: mirror wallet settings exactly — `route.tsx` (layout) +
  `index.tsx` (redirect) + one file per section, each a thin `RouteComponent` delegating
  to the existing module. No new `*-route.tsx` wrapper components are strictly required
  (wallet settings uses them because sections need `walletId`; user settings sections
  take no props), so the file route components can likely render the modules directly
  without an extra indirection layer — a simplification opportunity to flag for REASONS
  Canvas rather than mechanically copying the wallet pattern's wrapper-component layer.
- **Section route segment naming**: task text says "Language" tab but calls the redirect
  target implicitly `/settings/account`; the existing i18n message id is
  `settings.dialog.tabs.locale` and the query hook is `useUserLocale`. → Recommend
  `/settings/locale` as the URL segment (matches existing `locale` terminology in code)
  while keeping the "Language" label in UI copy — a naming decision to confirm in
  REASONS Canvas since the task prose uses "Language" throughout.

#### Alternatives Considered

- **Keep the dialog and just deep-link into it via a query param** (e.g.
  `?settings=account`): rejected — task explicitly asks for a standalone route
  mirroring the wallet-settings pattern, and a query-param dialog doesn't satisfy "back
  navigation to wherever the user was" as cleanly as a real route unmount.
  **Reuse `WalletShellLayout` directly with an optional `walletId`**: rejected — that
  component is threaded through with wallet-fetching (`useWallet`/`useWallets`), role-
  based section filtering, and owner-only sections; forcing it to also serve settings
  with no wallet would add conditionals to an already-long component rather than a small,
  purpose-built shell.

## Risk & Gap Analysis

#### Requirement Ambiguities

- **Back-navigation target when there's no prior in-app page** (e.g. user opens
  `/settings` via a bookmark, refresh, or a shared link): the task says "back
  navigation to wherever the user was before opening settings," which presumes a prior
  page exists. Needs a defined fallback (e.g. `/wallets`) for REASONS Canvas to encode.
- **Exact URL segment for the language section** (`/settings/locale` vs
  `/settings/language`): task prose says "Language," existing code says "locale"
  everywhere else (`useUserLocale`, `SettingsLocale`, `SupportedLocale`, `/api/users/
locale`). Needs an explicit decision, not an assumption.
- **Whether the settings shell needs a page header analogous to `WalletHeader`** (task
  doesn't show one in the screenshot description beyond the dialog title) — is a
  page-level `<h1>`/breadcrumb needed for the new route, or does each section's own
  `<h2>` (already present in every section component) suffice as the page heading?
  Current section components already render their own title (e.g. "Account", "Appearance"),
  which may make a page-level header redundant — but the back button needs _some_ chrome
  to live in.

#### Edge Cases

- **Mobile section switch loses back-target semantics**: if a mobile user taps into
  `/settings/appearance` then wants "back," should that go to `/settings` (the stacked
  list) or all the way to the pre-settings page? This is two different levels of "back"
  (section → settings home vs. settings → app) and the task only specifies the outer one
  explicitly.
  **Sidebar active-state highlighting**: `AppSidebarUser`'s dropdown item currently has no
  "active" indication since it opens a dialog; once it's a `Link` to `/settings`, does the
  broader `AppSidebar` need to reflect `/settings` as an active nav item the way wallet
  links do? Not mentioned in the task; likely out of scope but worth confirming since
  `AppSidebar`/`AppSidebarUser` aren't otherwise part of the settings module.
- **Existing wallet-settings mobile dropdown remains unchanged** — confirm this task's
  new mobile stacked-list pattern for `/settings` is not meant to also retrofit wallet
  settings' mobile nav; the task text scopes "mobile" only to this feature, but a
  reviewer could read "similar to a native settings app" as an invitation to also touch
  wallet settings. Should stay out of scope per constraint #1 ("routing and layout
  change" — for _this_ feature only).

#### Technical Risks

- **Dialog-vs-page focus/UX behaviors that don't automatically carry over**: the current
  `Dialog` from `@vhnam/ui` likely applies focus-trap and initial-focus-on-open behavior
  (standard for Radix/Base-UI-style dialog primitives, which this project's `Dialog`
  appears to wrap based on `DialogPrimitive.Close`). None of the three section
  components rely on dialog-provided focus behavior internally (no `autoFocus` props
  found in `SettingsAccount`, `SettingsAppearance`, or `SettingsLocale`), so no
  compensating focus logic looks necessary — but this should be visually verified once
  routes exist, since a lost "focus first field on open" behavior would be a silent
  regression for the account password form.
- **No close-on-save / close-on-success behavior exists today**: grepped
  `settings-account.actions.tsx` mutation path — nothing in the reviewed section
  components calls `onOpenChange`/closes the dialog on a successful mutation (e.g.
  password change just shows a toast and resets form state, it doesn't close the
  dialog). This means there is **no dialog-close-on-save behavior to replicate** on the
  page — flagging this explicitly per the task's request to "report any UX behavior tied
  to the dialog form... that needs an equivalent," since the answer is: none found beyond
  the default X-button dismiss, which back-navigation directly replaces.
  **`settings-account.actions.tsx` was not fully read for a second mutation path**
  (only the component was read) — worth a quick confirmation pass in REASONS Canvas that
  no `navigate`/`onOpenChange` call exists inside the actions hook.
- **Storybook impact looks like zero**: none of `settings-account`, `settings-appearance`,
  `settings-locale`, or `settings-dialog` live under `packages/ui` or have existing
  stories (confirmed no story files reference them); per `AGENTS.md`, only
  `packages/ui` components get Storybook stories, and these are all app-level
  (`apps/ledger-box/src/modules/`). The task's "update Storybook stories for any
  component whose mount point or props change" constraint likely resolves to **no
  stories need updates**, unless the new shell reuses a `packages/ui` component in a new
  way that has a story (none identified yet — worth confirming no `packages/ui`
  component's public API needs to change).

#### Acceptance Criteria Coverage

| AC#        | Description                                                                                               | Addressable?     | Gaps/Notes                                                                                                                                                                                                                                                                   |
| ---------- | --------------------------------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1          | `routes/_app/settings/` layout route with sub-sidebar + `<Outlet />`, mirroring wallet settings structure | Yes              | Precedent fully identified (`WalletShellLayout` + `_app/wallets/$walletId/settings/route.tsx` equivalent — actually the layout lives on `wallets/$walletId/route.tsx`, so the new settings layout route needs its own top-level `route.tsx`, not nested under a `$id` param) |
| 2          | Child routes per section, components moved unchanged                                                      | Yes              | All three components confirmed prop-less and self-contained; no internal changes needed                                                                                                                                                                                      |
| 3          | `/settings` redirects to `/settings/account`                                                              | Yes              | Exact `beforeLoad` redirect mechanism already proven in `wallets/$walletId/settings/index.tsx`                                                                                                                                                                               |
| 4          | Replace dialog close (X) with back navigation                                                             | Partial          | Mechanism (history back vs. fixed fallback) is an open design decision, not a gap in feasibility — needs resolution in REASONS Canvas, see Risks                                                                                                                             |
| 5          | Sidebar user menu entry navigates to `/settings` instead of opening dialog                                | Yes              | `AppSidebarUser` change is small and fully scoped: swap `useState`+`SettingsDialog` for a `Link`/`navigate` on the existing `DropdownMenuItem`                                                                                                                               |
| Mobile     | Stacked scrollable section list, not the desktop sub-sidebar squeezed down                                | Yes              | No existing in-repo precedent for this exact shape (wallet settings mobile is a dropdown, not a stacked list) — new pattern, addressable but not a copy-paste                                                                                                                |
| Constraint | No changes to section internals/actions/mutations                                                         | Yes              | Verified by reading all three section components; no dialog-coupled logic found inside them                                                                                                                                                                                  |
| Constraint | Deep-linkability                                                                                          | Yes              | Satisfied automatically by file-based child routes                                                                                                                                                                                                                           |
| Constraint | Storybook story updates                                                                                   | Yes (likely N/A) | No existing stories reference these modules; confirm no `packages/ui` API changes before concluding zero updates needed                                                                                                                                                      |
| Constraint | `vp check && vp test`                                                                                     | Yes              | Standard verification step, no blockers identified                                                                                                                                                                                                                           |
| Constraint | Changelog + root `CHANGELOG.md` update                                                                    | Yes              | Standard process per `AGENTS.md`; precedent merge files exist for the analogous wallet-settings refactor to use as a style reference                                                                                                                                         |
