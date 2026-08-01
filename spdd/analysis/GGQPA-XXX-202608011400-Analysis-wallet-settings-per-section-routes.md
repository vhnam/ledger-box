# SPDD Analysis: Split Wallet Settings into Per-Section Routes

## Original Business Requirement

Split the wallet settings page into per-section routes. Read `AGENTS.md` first.

Current state: `routes/_app/wallets/$walletId/settings.tsx` renders
`WalletSettingsPage`, which stacks five sections vertically on one scrollable page. Each
section already lives in its own module folder under
`src/modules/wallets/wallet-settings-*` with its own `.actions.tsx`.

## Task

1. Turn the current settings route into a layout route with section navigation and an
   `<Outlet />`.
2. Add child routes, each rendering its existing module component unchanged:
   general, activity, members, statement-shares, danger-zone.
3. Redirect `/settings` to `/settings/general`.
4. Keep the existing back navigation to the wallet.

## Constraints

- This is a routing change. Do not modify the section components' internals, their
  actions, or any API handler. If a section needs changes to work standalone, report it
  rather than silently rewriting it.
- Access rules established in the previous merge stay exactly as they are — route guards
  move to the child routes where applicable, but server-side checks are untouched.
- Navigation must work on mobile; the current page is a single scroll area, so decide
  between a tab strip and a section list and justify the choice in one sentence.
- Preserve deep-linkability: each section gets a stable URL.
- Update the Storybook stories if any section component's props change. Interactive
  components need a `play` function per the Review Checklist.
- Write the per-merge changelog and update the root `CHANGELOG.md`.

Report anything that turns out to be load-bearing about the single-page layout before
changing it.

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **`WalletSettingsPage`** (`src/modules/wallets/wallet-settings-page/wallet-settings-page.tsx`):
  currently the single component behind the `/settings` route. It owns: the pending/
  error/not-found guards, the **viewer redirect** (`walletPreview.role === 'viewer'` →
  `<Navigate to="/wallets/$walletId" />`, added in the prior merge), the `WalletHeader`,
  the "Back to wallet" link, a single `ScrollArea` (`scrollRestorationId="wallet-settings"`),
  and the vertical stack of all five sections inside one `max-w-2xl mx-auto` container.
- **The five section components**, each already self-contained with its own data
  fetching via hooks and its own `.actions.tsx` mutation handlers (per `AGENTS.md`'s
  documented pattern), taking either `wallet: WalletDto` or `walletId: string`:
  - `WalletSettingsGeneral({ wallet })` — rename form.
  - `WalletSettingsActivity({ walletId })` — paginated audit log; **currently gated
    in the parent**, not internally: `wallet-settings-page.tsx:71` only renders it when
    `walletPreview.role === 'owner'`. The component itself has no role awareness.
  - `WalletSettingsMembers({ wallet })` — member list/invite.
  - `WalletSettingsStatementShares({ wallet })` — share link list/create.
  - `WalletSettingsDangerZone({ wallet })` — delete wallet. Also has no internal role
    check; today it renders unconditionally and relies entirely on the parent page not
    being reachable by a viewer, plus the server-side `requireOwnedWallet` check.
- **`WalletAccessRole`** (`owner | manager | viewer`) on `WalletDto.role` — the same
  role value already used for the viewer redirect and the activity-section gate; this is
  the only per-section access differentiation that exists today (everything else is
  owner-or-manager, i.e. "not viewer").
- **Existing layout-route precedent**: `routes/_app/route.tsx` is the only pathless
  layout route in the app today — `beforeLoad` checks session, `component: AppLayout`
  renders an `<Outlet />`-based shell (via `AppLayout`) for all `_app/*` children. This
  is the direct pattern to extend for `settings` becoming a layout route, though it
  guards on session existence, not per-route data like `role`.
- **`@vhnam/ui` `Tabs`** (`packages/ui/src/components/tabs.tsx`): already exists and is
  already used elsewhere in the app (introduced per `docs/changelogs/mr-02-*`) — a
  concrete, already-adopted primitive for the "tab strip vs. section list" navigation
  decision, rather than a new one to build.
- **File-based routing** (TanStack Router): child routes under
  `_app/wallets/$walletId/settings/` would need a parent layout file (either
  `settings.tsx` converted to `settings/route.tsx`, or `settings/route.tsx` alongside
  `settings.index.tsx`, following TanStack Router's file-based nesting convention — the
  exact file layout is an implementation decision for REASONS Canvas, not this phase).

#### New Concepts Required

- **A settings-section navigation component** (tab strip or section list) that doesn't
  exist yet — none of the current sections render any inter-section navigation, since
  they're just stacked. This is new UI, not a modification of existing section
  internals, so it doesn't conflict with the "don't modify section components"
  constraint.
- **Per-child-route access gating for the activity section**: today "owner-only" is
  expressed as a _conditional render_ inside the parent stack. Once activity becomes its
  own routed URL (`/settings/activity`), the requirement's constraint ("route guards
  move to the child routes where applicable") means this must become an actual
  navigable-URL guard (redirect a non-owner away from that specific child route), which
  is conceptually new — today a non-owner literally cannot construct a URL that shows
  only activity, because there is no such URL.

#### Key Business Rules

- **Viewer exclusion from all of settings** (established in the prior merge): must
  continue to apply to the _layout_ route as a whole, not be re-derived or duplicated
  per child route — this is exactly the kind of single-point-of-guard rule
  `AGENTS.md`/the prior REASONS Canvas already established, and it governs where the
  redirect logic physically lives after the split.
- **Activity is owner-only, additionally to viewer-exclusion**: manager currently _can_
  reach general/members/statement-shares/danger-zone but _cannot_ see activity, per the
  server-side `requireOwnedWallet` guard on `GET /api/wallets/:walletId/activity` and
  the client-side conditional. This two-tier structure (viewer excluded from all of
  settings; manager excluded from activity specifically) must be preserved exactly, not
  flattened into a single role check across all child routes.
- **Section internals and API handlers are out of scope**: the task explicitly
  constrains this to routing. No section's data-fetching, mutation, or validation logic
  may change as a side effect of the route split.

## Strategic Approach

#### Solution Direction

Convert `settings.tsx` into a parent layout route (mirroring the existing `_app/route.tsx`
pattern) that owns everything currently in `WalletSettingsPage` _except_ the five
section bodies: the pending/error/not-found guards, the viewer redirect, `WalletHeader`,
back-navigation, the scroll container, and a new section-navigation element. Each
section then gets its own child route file that renders the existing section component
unchanged, passing it whatever prop it already expects (`wallet` or `walletId`) sourced
from the same `useWallet`/`useWallets` hooks the parent already uses. `/settings` itself
becomes an index/redirect route to `/settings/general`.

This keeps every section component's public interface and internals completely
untouched — satisfying the "do not modify section internals" constraint — while moving
composition (which sections show, in what order, behind what URL) into the route layer,
which is exactly what file-based routing is for.

#### Key Design Decisions

- **Where wallet data is fetched for child routes** — re-run `useWallet(walletId)` /
  `useWallets()` independently in each child route's component (cheap, since TanStack
  Query dedupes by query key and the parent layout already primes the cache) vs.
  introduce a loader-level fetch in the layout route and pass data down via route
  context/Outlet props. → The prior merge's REASONS Canvas already established that this
  codebase has **no existing pattern for data-driven `beforeLoad`/loader fetching**
  (`routes/_app/route.tsx`'s `beforeLoad` only checks session, not wallet data). Given
  that established boundary, the same conclusion applies here: re-using the hook-based
  pattern per child route (each child re-calls `useWallet`, gets a cache hit) is the
  conservative extension; introducing a loader-context pattern for this task would be a
  second, larger architectural change beyond what "split into routes" asks for. This
  should be confirmed explicitly in REASONS Canvas rather than assumed, since it affects
  every child route file.
- **Where the viewer redirect and pending/error/not-found guards live** — in the parent
  layout route's component (so they run once, before `<Outlet />`, and every child
  route trivially inherits them) vs. duplicated in each child. → The layout-route
  approach is the only one consistent with "route guards move to the child routes where
  applicable" (the requirement's own wording implies some guards belong at the child
  level and others don't) — viewer-exclusion applies uniformly to _all_ settings routes,
  so it belongs in the layout, not each child; activity's owner-only rule applies to
  _one_ route, so it belongs in that child specifically. This split needs to be explicit
  in REASONS Canvas's Structure section.
- **Tab strip vs. section list for navigation** — the task asks for a decision justified
  in one sentence. Given `@vhnam/ui`'s `Tabs` component is already built and already
  used elsewhere in the app, and five sections is a small, fixed, non-scrolling set (not
  a long list needing search/filter), a **tab strip using the existing `Tabs`
  component** is the direct, low-risk choice — it reuses an already-adopted primitive
  rather than introducing a new "section list" pattern, and five short labels
  (General/Activity/Members/Statement shares/Danger zone) fit a horizontal tab strip
  that can scroll or wrap on mobile without new components.
- **Scroll restoration per route** — the current single `ScrollArea` has one
  `scrollRestorationId="wallet-settings"` for the whole stack. Once each section is a
  separate route/URL, each child likely needs its own `scrollRestorationId` (e.g.
  `wallet-settings-general`, `wallet-settings-activity`, ...) so switching tabs doesn't
  carry over an unrelated scroll position. → Flagged as a concrete implementation detail
  for REASONS Canvas, not decided here, but the _need_ for per-route IDs (not one shared
  ID) is a direct consequence of the routing split and should not be overlooked.
- **Redirect mechanism for `/settings` → `/settings/general`** — a route-level
  `beforeLoad`/`loader` throwing `redirect()` (matches the existing `redirect()` usage
  in `routes/_app/route.tsx`) vs. an index route component that renders `<Navigate>`
  (matches the pattern just added for the viewer exclusion in the prior merge). →
  Both patterns already exist in this codebase for different reasons (loader-level for
  auth, component-level `<Navigate>` for role-based redirects); REASONS Canvas should
  pick one consistently — a loader-level `beforeLoad` redirect is likely more correct
  here since it's an unconditional structural redirect (not data-dependent), consistent
  with the `_app` root's own pattern, but this is a decision to make explicitly, not
  inherited implicitly from copying the nearest example.

#### Alternatives Considered

- **Keep the single-page scroll layout and only add anchor-link navigation** (in-page
  `#anchors` instead of real routes): rejected — the task explicitly requires
  deep-linkable, separately-routed URLs per section (`/settings/general`,
  `/settings/members`, etc.), and anchor links wouldn't satisfy "each section gets a
  stable URL" in the sense of independent route-level guards and page loads.
- **Fetching wallet/role data once via a loader and threading it through route context
  to every child**: considered, but not adopted as the recommended direction — this
  would introduce the queryClient-in-router-context pattern the prior merge's analysis
  already identified as absent from this codebase, expanding scope beyond a routing
  split into a new data-fetching architecture. Noted as a legitimate alternative for
  REASONS Canvas to re-weigh if the hook-per-child-route approach turns out to cause
  visible loading flicker between tabs.

## Risk & Gap Analysis

#### Requirement Ambiguities

- **Exact file/folder layout for the nested routes** is unspecified — TanStack Router's
  file-based convention supports multiple equivalent layouts (e.g. `settings/route.tsx`
  - `settings/general.tsx` + `settings/index.tsx`, or `settings.route.tsx` +
    `settings.general.tsx`). This is an implementation detail for REASONS Canvas, but
    worth flagging now since it determines the generated `routeTree.gen.ts` shape and
    should follow whatever minimal-diff convention TanStack Router's file-based routing
    expects in this repo (no other nested layout route exists in the tree to copy
    directly — `_app/route.tsx` is pathless/root-level, not a nested example).
- **URL segment naming**: the task lists sections as "general, activity, members,
  statement-shares, danger-zone" — presumably these become the literal route segments
  (`/settings/general`, `/settings/statement-shares`, etc.), matching the existing
  module folder names, but this should be confirmed rather than assumed, since
  `wallet-settings-danger-zone` as a module name doesn't necessarily dictate
  `danger-zone` as the prettiest URL segment (vs. e.g. `delete`).
- **Whether the activity route should redirect a non-owner or 404/render nothing**: the
  requirement says "route guards move to the child routes where applicable" but doesn't
  specify the exact non-owner UX for `/settings/activity` — redirect to
  `/settings/general` (most consistent with the viewer pattern) vs. redirect to
  `/wallets/$walletId` vs. show a "not available" message. Needs an explicit answer
  before REASONS Canvas, since it's a real UX decision, not just plumbing.

#### Edge Cases

- **A manager (who passes the layout's viewer-exclusion guard) directly navigates to
  `/settings/activity`**: must still be blocked, now via a route-specific guard rather
  than the parent's conditional render — this is the one case where "route guards move
  to the child routes" is not just a refactor but adds real coverage the single-page
  version didn't need (the old version simply never rendered the activity component for
  a manager; a manager typing the URL directly for the child-route version needs an
  actual redirect, not just "isn't rendered because no button links there").
- **Deep link directly to a child route before wallet data resolves** (e.g. bookmarked
  `/settings/members`): the pending/error/not-found guards must still run before the
  section renders, same as today — since these guards are proposed to live in the
  layout route wrapping `<Outlet/>`, this should already be covered, but must be
  verified: does `<Outlet/>` only render after the layout component's own guards return,
  or could a child route's own loader run independently and race the parent's guard?
  Worth an explicit check in REASONS Canvas/implementation.
- **Switching tabs while a section has an unsaved form or open dialog** (e.g. general's
  rename form has pending edits, or danger-zone's delete confirmation dialog is open):
  navigating away via the new tab strip will unmount the section component entirely
  (different route = different component tree), silently discarding in-progress state.
  This is a UX regression risk introduced specifically by the routing split (the old
  single-page version never unmounted sections). Not explicitly addressed by the task;
  worth surfacing as a decision point (e.g. whether to warn on navigation away from a
  dirty form) even if the answer is "acceptable, out of scope for this pass."
- **Mobile tab strip overflow**: five tab labels ("Statement shares" being the longest)
  on a narrow viewport — the task requires mobile-working navigation but doesn't specify
  overflow behavior (horizontal scroll within the tab strip vs. wrapping vs.
  abbreviated labels). `@vhnam/ui`'s `Tabs` component's existing overflow behavior
  should be checked before assuming it handles this without adjustment.

#### Technical Risks

- **`routeTree.gen.ts` regeneration**: this file is auto-generated (per `AGENTS.md`'s
  repository layout notes on file-based routing) — adding nested route files requires
  the dev/build tooling to regenerate it; if a manual step is needed, that must be
  documented in the changelog's "Setup after merge" section like `mr-12`'s example
  already does for other structural changes.
- **Storybook impact**: the task's constraint says update stories "if any section
  component's props change" — per the Approach decided above (section internals
  untouched, props unchanged), **no section component prop signatures should change**,
  so this constraint is likely a no-op. This should be explicitly confirmed during
  REASONS Canvas / generation (verify zero prop-shape diffs) rather than skipped, since
  getting it wrong either direction (missing a needed story update, or claiming "no
  changes needed" incorrectly) has been called out explicitly by the requirement.
- **No existing Storybook stories found for any `wallet-settings-*` component** (search
  confirmed zero `.stories.*` files under this module path) — so "update the Storybook
  stories if props change" has no existing stories to update today regardless of
  outcome. Worth stating explicitly rather than silently passing over, since it may
  look like an overlooked step if not called out.
- **Zero test coverage for routing behavior specifically**: the existing Vitest suite
  (`netlify/functions/lib/*.test.ts`) covers server-side authorization only: there is no
  existing pattern in this repo for testing TanStack Router route trees/guards
  client-side. The task doesn't request new tests, but the viewer-redirect and
  activity-owner-guard behaviors are exactly the kind of regression a route split could
  silently break — worth flagging as a gap even though out of the stated task scope.

#### Acceptance Criteria Coverage

| AC# | Description                                                            | Addressable? | Gaps/Notes                                                                                                                                                                                                                                                                       |
| --- | ---------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Settings route becomes a layout route with section nav + `<Outlet />`  | Yes          | Direct extension of the existing `_app/route.tsx` pathless-layout pattern                                                                                                                                                                                                        |
| 2   | Five child routes render existing section components unchanged         | Yes          | Confirmed all five components already take `wallet`/`walletId` props sourced from hooks already used by the parent — no internal changes needed                                                                                                                                  |
| 3   | `/settings` redirects to `/settings/general`                           | Yes          | Mechanism (loader-redirect vs. `<Navigate>`) needs an explicit pick, both patterns already exist in the codebase                                                                                                                                                                 |
| 4   | Existing back-to-wallet navigation preserved                           | Yes          | Lives in the layout route alongside `WalletHeader`, unaffected by the split                                                                                                                                                                                                      |
| 5   | Section internals/actions/API handlers untouched                       | Yes          | Verified by direct read of all five components — none require changes to work standalone under separate routes                                                                                                                                                                   |
| 6   | Access rules unchanged; guards move to child routes "where applicable" | Partial      | Viewer-exclusion (layout-level) and activity's owner-only gate (child-level) must both be preserved with different guard placements — needs explicit design in REASONS Canvas, and the manager-direct-navigation-to-activity edge case needs real coverage it didn't need before |
| 7   | Mobile-working navigation, tab strip vs. section list justified        | Yes          | Tab strip recommended, reusing the already-existing `@vhnam/ui` `Tabs` component; overflow/wrap behavior on mobile needs verification, not just assumption                                                                                                                       |
| 8   | Each section deep-linkable at a stable URL                             | Yes          | Direct consequence of the file-based child routes; URL segment naming needs confirmation                                                                                                                                                                                         |
| 9   | Storybook stories updated if props change                              | Partial      | No prop changes expected per this analysis (and no existing stories exist for these components today) — should be explicitly verified, not silently skipped, during generation                                                                                                   |
| 10  | Per-merge changelog + root `CHANGELOG.md` update                       | Yes          | Follows the same convention used for the two most recent merges (`mr-16`, `mr-17`)                                                                                                                                                                                               |
