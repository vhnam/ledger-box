# SPDD Analysis: Settings UI Polish (Mobile Nav, Theme Fade, Design-System Cleanup)

## Original Business Requirement

> No business requirement document was supplied. Per user instruction ("analyze from the new
> code of this branch and write new analyze"), this analysis is **reverse-engineered from the
> `feat/settings-ui-polish` branch's actual code changes** (commits `8b5d06e` and `35760b2` on
> top of `main`), rather than from a prior spec. The reconstructed intent below is inferred
> from the diff and commit messages, not copied from an original ticket:
>
> - Polish the Settings and Wallet Settings experience: cards, spacing, and mobile navigation.
> - Replace the old mobile "back link + full section list" pattern in Settings with a compact
>   dropdown menu that shows the active section and lets the user jump to another one.
> - Add a smooth cross-fade transition when switching between light/dark/system theme, using
>   the View Transitions API where available, respecting `prefers-reduced-motion`.
> - Reorder Appearance settings so the locale picker appears above the theme picker.
> - Prune unused UI components (`alert`, `tabs`) and their stories, and standardize
>   `ring-[3px]` usage to the `ring-3` Tailwind utility across shared components.
> - Document design-system rules in `AGENTS.md` so future changes stay consistent.

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **Settings Shell (`SettingsShellLayout`)**: The layout shell wrapping all `/settings/*`
  pages (Account, Appearance, Locale) — owns the desktop sidebar nav and, on mobile, the
  sub-header navigation control. Relates to `SectionShellLayout`, the generic two-pane
  (sidebar + content) layout primitive it wraps.
- **Section Shell Layout (`SectionShellLayout`)**: Generic layout primitive providing a
  `sidebar` slot (desktop), a `mobileBar` slot (mobile sub-header), and a scrollable content
  area. Used by both the Settings shell and the Wallet Settings shell.
- **Wallet Settings modules**: `wallet-settings-general`, `wallet-settings-members`,
  `wallet-settings-activity`, `wallet-settings-statement-shares` — per-wallet configuration
  screens, each with its own route, actions, and view component. These are a parallel
  settings surface to the account-level Settings shell, scoped to a single wallet.
- **Theme (`useTheme` from `@vhnam/ui`)**: Existing hook exposing `theme` (`'dark' | 'light' |
'system'`) and `setTheme`. Consumed by `SettingsAppearance`.
- **`@vhnam/ui` component library**: Shared presentational components (`Card`, `Button`,
  `DropdownMenu`, `Icon`, `Badge`, `Calendar`, `ScrollArea`, `Toast`, `Toggle`, etc.) used
  across the app and documented via Storybook.

#### New Concepts Required

- **Theme Transition (`#/lib/theme/theme-transition.ts`)**: A new app-level utility,
  `switchThemeWithTransition(setTheme, theme)`, wrapping the existing `setTheme` call in a
  `document.startViewTransition` when the browser supports it and the user has not requested
  reduced motion — otherwise it falls back to calling `setTheme` directly. This is a UX
  enhancement layered on top of the existing theme concept, not a new domain entity; it
  introduces an `AppTheme` type alias (`'dark' | 'light' | 'system'`) that now lives in
  `#/lib/theme` and is re-exported for `SettingsAppearance` to consume instead of a local
  duplicate type.
- **Settings Section Dropdown (mobile nav)**: Replaces the previous mobile pattern of showing
  a full section list at `/settings` and a "Back" link inside each section. The new pattern
  keeps `Outlet` always mounted and instead renders a `DropdownMenu` in the mobile sub-header
  showing the currently active section (icon + label) with a menu of the other sections. This
  removes the `isMobileListVisible` / `SettingsMobileList` / `SettingsBackLink` concepts
  entirely — `/settings` now always redirects to `/settings/account` (desktop and mobile
  alike), so "no section selected" is no longer a valid UI state.
- **Design-system rules (`AGENTS.md`)**: New documented conventions (e.g. preferring `ring-3`
  over arbitrary `ring-[3px]`) that govern how shared `@vhnam/ui` components should be styled
  going forward. Not a runtime concept, but a constraint that future settings/UI work should
  respect.

#### Key Business Rules

- **`/settings` always redirects to `/settings/account`**: Previously this redirect only
  applied on desktop (mobile showed a section list instead); now it applies unconditionally,
  since the mobile experience no longer has a distinct "list" state — governs
  `SettingsShellLayout`'s navigation effect.
- **Theme changes should animate, except when the user prefers reduced motion or the browser
  lacks View Transitions support**: governs `switchThemeWithTransition` — this is an implicit
  accessibility rule (respecting `prefers-reduced-motion`) surfaced explicitly in the new
  utility and its test suite.
- **No-op theme selection should not trigger a transition**: `SettingsAppearance`'s
  `handleThemeSelect` short-circuits when the selected value equals the current theme,
  avoiding a redundant/visible transition on re-clicking the active option.
- **Unused shared components must not linger in `@vhnam/ui`**: the removal of `alert.tsx` and
  `tabs.tsx` (plus their Storybook stories) implies a rule that shared components without any
  consumer in the app should be pruned rather than kept "just in case."

## Strategic Approach

#### Solution Direction

- **Mobile settings navigation**: moved from a "two-state" shell (list view vs. section view,
  toggled by `isMobileListVisible`) to a "single persistent Outlet + dropdown selector" shell.
  This removes a class of routing/visibility bugs (e.g., the old mobile-detection check via
  `window.matchMedia` duplicating what `useIsMobile` already provided) and aligns the mobile
  and desktop layouts around the same `Outlet`-always-rendered model, differing only in how
  section switching is exposed (`sidebar` slot vs. `mobileBar` dropdown).
- **Theme switching UX**: layered a thin, app-local utility (`#/lib/theme`) on top of the
  existing shared `useTheme` hook rather than modifying `@vhnam/ui`'s theme hook itself,
  keeping the View Transitions concern app-specific (it depends on `document`/CSS in
  `style.css`, which is app-owned) while the theme state concept stays in the shared package.
- **Data flow (theme)**: `SettingsAppearance` (ThemeOption click) → `handleThemeSelect` →
  `switchThemeWithTransition` (app lib) → `setTheme` (shared hook, wrapped in
  `document.startViewTransition` + `flushSync` when eligible) → CSS `::view-transition-*`
  rules in `style.css` render the crossfade.
- **Component pruning**: leveraged existing Storybook stories as the signal for "is this
  component still exhibited/used" — removed `alert` and `tabs` together with their stories in
  the same commit, keeping the shared package's surface area matched to actual consumers.

#### Key Design Decisions

- **View Transitions API vs. a CSS/JS-only crossfade library**: trade-off is
  browser-native, zero-dependency, respects `prefers-reduced-motion` naturally via an early
  bail-out, but is unsupported in some browsers (Firefox at time of writing) → recommendation
  taken: use the native API with a synchronous fallback (`canUseViewTransition` gate), so
  unsupported browsers get the theme change instantly with no error, no polyfill needed.
- **Dropdown vs. retaining a full mobile section list**: a full list gives more visual context
  per section (icons + labels all visible at once) but costs a full "no Outlet" screen state
  and back-navigation logic; a dropdown trades that context for a persistent Outlet and a
  much smaller component surface (no `SettingsBackLink`/`SettingsMobileList`) → recommendation
  taken: dropdown, since it also removes the special-cased `matchMedia` check duplicating
  `useIsMobile`.
- **`ring-[3px]` vs. `ring-3`**: Tailwind's built-in `ring-3` utility is equivalent to the
  arbitrary value but is the canonical, greppable form → recommendation taken: standardize on
  `ring-3` and document it in `AGENTS.md` so it isn't reintroduced.

#### Alternatives Considered

- **Reusing `useIsMobile` + `matchMedia` guard for the `/settings` auto-redirect**: rejected
  in favor of removing the guard entirely, since the mobile UI no longer has a state where
  redirecting would be wrong (there's no more "show list" branch to preserve).
- **Polyfilling View Transitions for unsupported browsers**: not pursued — the fallback path
  (instant `setTheme`) already yields a fully functional (non-animated) theme switch, so a
  polyfill would add complexity for a purely cosmetic gap.

## Risk & Gap Analysis

#### Requirement Ambiguities

- Since no formal requirement/ticket exists for this branch, the "intended scope" is inferred
  purely from the diff. It's unclear whether wallet-settings changes (activity, general,
  members, statement-shares — all show significant line churn) are part of the same "polish"
  effort as the Settings shell/theme work, or a separate concern bundled into the same
  branch. Recommend clarifying with the author whether these should be split into separate
  SPDD prompts (one for Settings shell/mobile nav/theme, one for Wallet Settings polish).
- `AGENTS.md`'s new design-system rules were not read in full during this pass beyond the
  `ring-3` convention; if there are additional rules (e.g. spacing scale, icon sizing) they
  should be captured explicitly if a REASONS Canvas for future UI work is generated from this
  analysis.

#### Edge Cases

- **Rapid theme toggling**: `switchThemeWithTransition` does not guard against overlapping
  `startViewTransition` calls if the user clicks multiple theme options in quick succession
  before the previous transition finishes — worth verifying the browser's own transition
  queuing behavior is acceptable, or whether a debounce/disable-while-transitioning guard is
  needed.
- **`/settings` deep-link on mobile with slow network**: since the mobile "list" fallback is
  gone, a user landing on `/settings` now always waits for the redirect to
  `/settings/account` before seeing any content — there is no longer an intermediate "pick a
  section" screen to render while data loads.
- **DropdownMenu section highlighting**: the active-section dot indicator relies on
  `matchedSection` computed from the last pathname segment; nested/future settings routes with
  additional path segments (e.g. a detail page under a section) could break this matching and
  silently show no active indicator.

#### Technical Risks

- **`flushSync` inside `document.startViewTransition`**: forces a synchronous React render
  mid-transition; if `setTheme` triggers expensive downstream re-renders, this could cause a
  visible jank despite the crossfade intent. Low risk given `setTheme` is a small state update,
  but worth noting if the theme hook's implementation changes later.
- **Test coverage for `theme-transition.ts` stubs `window`/`document` globally** via
  `vi.stubGlobal`, which is inherently coupled to the exact shape of the DOM APIs used
  (`matchMedia`, `startViewTransition`) — future browser API changes (e.g. new
  `startViewTransition` options) would need matching test updates.
- **Removed components (`alert`, `tabs`)**: if any code outside this branch's diff (e.g. a
  feature branch not yet merged) still imports `@vhnam/ui/components/alert` or `.../tabs`,
  merging this branch would break that branch's build. Recommend a repo-wide grep for
  `components/alert` and `components/tabs` imports before merge if there are other active
  branches.

#### Acceptance Criteria Coverage

| AC# | Description                                                                       | Addressable? | Gaps/Notes                                                                                                                                                 |
| --- | --------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Settings mobile nav uses a compact section dropdown instead of a back-link + list | Yes          | Implemented in `settings-shell-layout.tsx`; verified via diff.                                                                                             |
| 2   | `/settings` redirects to `/settings/account` on both mobile and desktop           | Yes          | `useEffect` no longer branches on `isMobile`.                                                                                                              |
| 3   | Theme switching animates via View Transitions with reduced-motion fallback        | Yes          | Implemented in `theme-transition.ts` with accompanying unit tests.                                                                                         |
| 4   | Locale picker appears above theme picker in Appearance settings                   | Yes          | Confirmed via JSX reordering in `settings-appearance.tsx`.                                                                                                 |
| 5   | Unused shared UI components and stories are pruned                                | Yes          | `alert.tsx`, `tabs.tsx`, and their stories removed; needs a cross-branch import check (see Technical Risks).                                               |
| 6   | `ring-[3px]` usages standardized to `ring-3`                                      | Partial      | Confirmed for `badge.tsx`, `calendar.tsx`, `scroll-area.tsx`, `toast.tsx`, `toggle.tsx`; full repo-wide sweep not independently verified in this analysis. |
| 7   | Design-system rules documented for future contributors                            | Yes          | New section added to `AGENTS.md`; full content not deeply reviewed here.                                                                                   |
| 8   | Wallet Settings screens (general/members/activity/statement-shares) polish        | Partial      | Large diffs confirmed present; specific visual/behavioral intent not independently derivable from diff alone — recommend author confirmation.              |
