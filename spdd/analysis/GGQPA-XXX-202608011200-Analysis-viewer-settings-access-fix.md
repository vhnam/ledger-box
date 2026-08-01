# SPDD Analysis: Fix Viewer Access to Wallet Settings

## Original Business Requirement

Fix Viewer access to wallet settings. This is a permission bug in shipped code, not a
new feature. Read `AGENTS.md` first.

Context: `viewer` is the only non-owner role actually granted in practice — the wallet
owner invites the money recipient as a Viewer so they can check the wallet themselves.
`manager` exists in code but is not used. A Viewer can currently open
`/wallets/$walletId/settings`, which stacks five sections: general, activity, members,
statement-shares, danger-zone.

## Step 1 — Report before changing anything

For each of the five settings sections, determine what a `viewer` session currently sees
and what its backing API currently returns for a viewer:

- general (wallet name, timezone)
- activity (already owner-only — confirm the guard is server-side, not just hidden in UI)
- members — does a viewer get the member list, including other members' email addresses?
- statement-shares — does a viewer see which links exist, their periods, and access counts?
- danger-zone — is the delete button rendered, and does `DELETE /api/wallets/:walletId`
  reject a viewer?

Report each as: what the UI renders, what the API returns, and whether the restriction is
enforced server-side or only by hiding the component.

## Step 2 — Apply the intended rule

A viewer must not reach wallet settings at all. Redirect them to the wallet page.

Enforce this in both places:

- Route level, so the page does not render — but treat this as UX only.
- API level, in the handlers, using the existing helpers in
  `netlify/functions/lib/tenant-access.ts`. Owner-only settings endpoints must reject a
  viewer regardless of what the client does. Hiding a component is not a permission check.

Also confirm the settings gear on the wallet page is hidden for viewers.

## Constraints

- Do not introduce a permission table, a new role, or any RBAC abstraction. Use the
  existing `owner` / `manager` / `viewer` helpers.
- Do not change what a viewer can see on the wallet page itself — transactions, summary,
  and attachments stay accessible. Only settings is being closed.
- Add tests to the existing `apps/ledger-box` Vitest project covering viewer rejection on
  each owner-only settings endpoint.
- Write the per-merge changelog to `docs/changelog/` and update the root `CHANGELOG.md`.

If step 1 shows a viewer was reading other people's email addresses or statement-share
details, call that out explicitly in the changelog as a disclosure fix, not a refactor.

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **WalletAccessRole** (`owner | manager | viewer`): resolved per-request by
  `requireWalletAccess` in `apps/ledger-box/netlify/functions/lib/tenant-access.ts:105-153`.
  This already exists and works — it auto-activates pending `wallet_member` invites and
  returns a role for owner, active member (`manager`/`viewer`), or denies with a 404
  disguised as "Wallet not found." This directly supersedes the "Known gap" note in
  `AGENTS.md:75-79`, which still describes the pre-member-access state (member APIs
  requiring `tenant_id` ownership). That note is stale documentation, not current
  behavior — the read-access work was already implemented (see prior analysis
  `GGQPA-XXX-202607280112-Analysis-wallet-member-read-access.md` and its paired feature
  `GGQPA-XXX-202607280116-[Feat]-api-wallet-member-access.md`).
- **`requireOwnedWallet`** (`tenant-access.ts:60-71`): strict owner-only check
  (`wallet.tenantId === tenantId`), unrelated to `wallet_member`. This is what all four
  settings-adjacent read/write handlers actually call today.
- **`requireWalletWriteAccess`** (`tenant-access.ts:155-171`): resolves member access via
  `requireWalletAccess`, then rejects `viewer` with 403 "Read-only access." Used only by
  the wallet rename path (`wallet.mts:87`).
- **Settings sections as separate modules**: `wallet-settings-general`,
  `-activity`, `-members`, `-statement-shares`, `-danger-zone`, each with its own
  `.actions.tsx`, composed into one page/route
  (`src/modules/wallets/wallet-settings-page/wallet-settings-page.tsx`).
- **The four settings-adjacent API handlers, confirmed by direct read:**
  - `PATCH /api/wallets/:walletId` (rename, general section) → `requireWalletWriteAccess`
    → viewer gets 403. **Enforced server-side.**
  - `DELETE /api/wallets/:walletId` (danger-zone) → `requireOwnedWallet` → viewer gets 404
    (not owner, not matched). **Enforced server-side.**
  - `GET/POST /api/wallets/:walletId/members`, `PATCH/DELETE .../members/:memberId`
    (members section) → `requireOwnedWallet` in all four handlers
    (`wallet-members.mts:54`, `wallet-member.mts:64`) → viewer gets 404. **Enforced
    server-side.**
  - `GET/POST /api/wallets/:walletId/statement-shares` → `requireOwnedWallet`
    (`wallet-statement-shares.mts:65`) → viewer gets 404. **Enforced server-side.**
  - `GET /api/wallets/:walletId/activity` → `requireOwnedWallet`
    (`wallet-activity.mts:39`) → viewer gets 404. **Enforced server-side.**

  **Correction to the task's premise**: every settings-backing endpoint already rejects a
  viewer server-side today. There is no data-disclosure bug — a viewer cannot fetch the
  member list, email addresses, or statement-share details through these APIs regardless
  of what the client renders. This should be stated plainly in the Step 1 report and the
  eventual changelog: **no viewer data was ever exposed by these APIs**, so the "call it
  out as a disclosure fix" instruction in the requirement will not apply once Step 1 is
  actually executed — reserve that framing for `general`/rename or any endpoint found to
  differ from this pattern.

- **UI-side gating (confirmed by direct read, no `wallet.role` check found anywhere):**
  - Settings gear: `wallet-actions.tsx:58-68` — renders unconditionally.
  - `wallet-settings-page.tsx:41-77` — no route/page guard; only the `activity` section
    is conditionally rendered (`walletPreview.role === 'owner'`, line 67) — UI-only, but
    backed by a real server check as noted above, so this one is fully covered already.
  - `wallet-settings-danger-zone.tsx:13-35` — delete button renders unconditionally.
  - `wallet-settings-members.tsx` / `wallet-settings-statement-shares.tsx` — render
    unconditionally, branch only on loading/empty state, not role.

#### New Concepts Required

None. Every enforcement primitive needed already exists: `requireOwnedWallet` (used
correctly by four of five sections), `requireWalletWriteAccess` (used correctly by
rename), and `wallet.role` (already present on the client-side wallet object, used once
today for the activity section and is the same pattern to replicate for the remaining
four sections plus the gear icon and the route itself).

#### Key Business Rules

- **Settings is owner-only in totality**: the requirement's actual intent — closing the
  whole settings surface to non-owners, not just individual actions — is new relative to
  today's code, which enforces "owner-only" per-endpoint but not "owner-only" as a
  concept for the page/route as a whole. `manager` role is currently unused in practice,
  so this rule needs to also state whether `manager` (if ever granted) should reach
  settings — the requirement's framing ("a viewer must not reach wallet settings")
  is worded viewer-specific; whether `manager` is intended to have settings access is an
  open question surfaced below.
- **No new authorization abstraction**: reuse existing role-check helpers exactly as
  named; do not generalize into a permission table (explicit constraint from the
  requirement, consistent with `AGENTS.md`'s existing pattern of one shared choke point
  in `tenant-access.ts`).
- **Hiding UI is not a permission check** (explicit constraint from the requirement):
  applies to the route guard and all four remaining components/gear icon — each needs
  both a client-side redirect/hide (UX) and to rely on the pre-existing, already-correct
  server-side checks (no new server enforcement is actually required for four of five
  sections, since it's already there — the gap is purely client-side UX plus the route
  guard).

## Strategic Approach

#### Solution Direction

Two independent layers, matching the requirement's own split:

1. **Route/page layer**: add a guard at `/wallets/$walletId/settings` (or in
   `WalletSettingsPage`) that redirects non-owner sessions to `/wallets/$walletId` before
   rendering any section — mirroring the existing `walletPreview.role === 'owner'`
   pattern already used for the activity section, but applied to the whole page rather
   than per-section. This makes the per-section UI-hiding checks currently missing on
   members/statement-shares/danger-zone moot in practice (a viewer never reaches them),
   but they should still be added for defense-in-depth and consistency with the activity
   section's existing pattern, and because a `manager` might still reach the page after
   the open question below is resolved.
2. **API layer**: the report step will find four of five backing endpoints already
   correctly reject viewers server-side via `requireOwnedWallet`. The only endpoint not
   yet using an owner/role check that matches the requirement's intent is worth
   double-checking against the resolved `manager`-access question (see below) — if
   `manager` should also be excluded from settings, `requireOwnedWallet` already achieves
   that (it's strict-owner, not role-aware), so no handler change is likely needed at
   all. This significantly shrinks the task from "fix five leaking endpoints" to "close
   the route/UI gap that the API layer was already covering."

This keeps the change concentrated in the route/page layer and the two components that
currently lack the `wallet.role` check the activity section already demonstrates,
following the codebase's own established pattern rather than introducing a new one.

#### Key Design Decisions

- **Where to put the route guard** — TanStack Router `beforeLoad`/loader-level redirect
  on the settings route, vs. a render-time check inside `WalletSettingsPage`. →
  Recommend the route-level guard (`beforeLoad` with a `redirect()`) since the
  requirement explicitly asks for "route level, so the page does not render," and
  TanStack Router's loader/`beforeLoad` runs before component render, avoiding an initial
  flash of the settings page. This needs wallet role available before render, which
  today only comes from `useWallet`/`useWallets` (React Query) inside the component —
  the reasons-canvas phase should resolve how to get `role` into a route `beforeLoad`
  (e.g. via `queryClient.ensureQueryData` in the loader, consistent with any existing
  loader patterns in the route tree) without duplicating the fetch.
- **Whether `manager` should also be excluded from settings** — the requirement's prose
  only says "a viewer must not reach wallet settings," and separately says "`manager`
  exists in code but is not used." → This is a genuine open question, not a strategic
  choice to make silently: if `manager` should also be settings-owner-only, the guard
  condition is `role !== 'owner'`; if `manager` should retain settings access (e.g. to
  eventually manage members), the guard condition is `role === 'viewer'`. Recommend
  surfacing this explicitly before REASONS Canvas rather than guessing, since it changes
  the guard's condition and the API-layer conclusion above.
- **Scope of API-layer changes** — given four of five endpoints are already correctly
  owner-only, and the fifth (`PATCH` rename) already correctly excludes viewers via
  `requireWalletWriteAccess` (owner or manager, not viewer) → likely **no API handler
  changes are required at all**, only the addition of tests proving the existing
  behavior, unless the `manager`-exclusion question above resolves to "manager must also
  be excluded from settings," in which case `wallet.mts`'s `PATCH` path would need to
  move from `requireWalletWriteAccess` to `requireOwnedWallet` to match. This should be
  confirmed, not assumed, in the next phase.

#### Alternatives Considered

- **Building a new `requireOwnerOnlySettingsAccess` helper**: rejected — every section
  already funnels through either `requireOwnedWallet` or `requireWalletWriteAccess`;
  introducing a new named helper for the same "owner-only" predicate that
  `requireOwnedWallet` already expresses would duplicate logic the constraints
  explicitly warn against ("no new RBAC abstraction").
- **Only fixing the UI (gear + route redirect) without touching the API layer**:
  considered as the likely final scope once Step 1 confirms the API is already correct,
  but not adopted as the plan yet — it's the probable outcome, not a decision to make
  before the report step actually runs and the manager-exclusion question is answered.

## Risk & Gap Analysis

#### Requirement Ambiguities

- **Manager's intended relationship to settings** is unresolved (see above) — the
  requirement text is viewer-specific but the "constraints" section talks about
  "owner-only settings endpoints," which is ambiguous about whether that phrase means
  "endpoints only the owner may call" (current, real state) or "endpoints only the owner
  may call, and today includes rename which also permits manager." This needs a yes/no
  answer before the guard condition can be written.
- **What "the wallet page" redirect target means**: `/wallets/$walletId` is unambiguous
  as a route, but should the redirect show any messaging (e.g. a toast explaining why),
  or silently land on the wallet page? Not specified.
- The requirement asks to report whether restrictions are "enforced server-side or only
  by hiding the component" — this is now answered by this analysis: they already are
  server-side for four of five sections, and the general/rename section is also already
  covered by `requireWalletWriteAccess`. The Step 1 report in the next phase can be
  largely mechanical rather than investigative.

#### Edge Cases

- **Direct navigation / deep link**: a viewer pasting the settings URL directly (not
  clicking the gear) must hit the same `beforeLoad` guard — confirm the guard isn't only
  reachable through the gear-icon click path.
- **Role change mid-session**: if an owner demotes a manager to viewer (or removes them)
  while they have the settings tab open, the existing `tenant-access.ts` checks are
  already stateless per-request (noted in the prior member-access analysis), so the next
  API call from a now-viewer session will already 404/403 correctly; only the client-side
  guard needs to handle a **subsequent** navigation, not an already-open tab, which is
  out of scope for a redirect-based guard.
- **Owner viewing their own wallet while impersonating no one**: no change — must
  continue to work exactly as today.
- **`walletPreview` fallback in `wallet-settings-page.tsx:23`** (`wallet ?? wallets?.find(...)`)
  — the guard must key off `role` on whichever source actually resolves first, since the
  component already tolerates a two-source fallback for the wallet object itself; the
  route-level `beforeLoad` guard should not introduce a race where it sees a different
  `role` than what the page eventually renders with.

#### Technical Risks

- **Getting `role` into a route `beforeLoad` without duplicating fetches**: role is
  currently only known after `useWallet`/`useWallets` resolve inside the React component
  tree. A loader-level redirect needs this data before component mount — likely via
  `context.queryClient.ensureQueryData(walletQueryOptions(walletId))` or equivalent,
  reused by the component afterward via the same query key so no double-fetch occurs.
  This is a legitimate implementation risk worth flagging now since it's the one place
  where "route level" enforcement is nontrivial, unlike the component-level checks which
  can trivially copy the existing `walletPreview.role === 'owner'` pattern.
- **Loader failure handling**: the component already handles `isPending`/`isError` for
  the wallet fetch itself; confirm the route guard degrades gracefully (e.g. treats
  "wallet not found" the same as "not owner," redirecting rather than crashing) rather
  than assuming the query always resolves before the guard runs.
- **Zero existing test coverage on `apps/ledger-box`** (noted in the prior member-access
  analysis, still true unless changed since): adding the requirement's requested Vitest
  coverage for viewer rejection on each owner-only endpoint will be the first tests in
  this app if none have been added since — worth confirming current test-file count
  before REASONS Canvas so the plan accounts for any missing test-setup scaffolding
  (test DB, fixtures, etc.), not just the test cases themselves.

#### Acceptance Criteria Coverage

| AC# | Description                                                                           | Addressable? | Gaps/Notes                                                                                                                                                                                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Step 1 report covers all five sections (UI + API + enforcement layer)                 | Yes          | Substantially pre-answered by this analysis; next phase should verify by re-reading the same files rather than re-deriving, and confirm no drift since this analysis was written                                                                                                                              |
| 2   | Viewer redirected from settings route before render                                   | Yes          | Needs the `beforeLoad`/loader role-resolution design decided (see Technical Risks)                                                                                                                                                                                                                            |
| 3   | Owner-only settings endpoints reject viewer server-side regardless of client          | Partial      | Already true for 4 of 5 endpoints (members×4, statement-shares×2, activity, delete-wallet); rename already excludes viewer via `requireWalletWriteAccess`. Only a gap if the manager-exclusion question resolves to "manager must also be excluded," which would require changing rename's helper             |
| 4   | Settings gear hidden for viewers on the wallet page                                   | Yes          | Direct analog to the existing `walletPreview.role === 'owner'` pattern in `wallet-settings-page.tsx:67`, applied to `wallet-actions.tsx:58-68`                                                                                                                                                                |
| 5   | Vitest coverage added for viewer rejection on each owner-only settings endpoint       | Yes          | Straightforward given endpoints already behave correctly — tests should assert existing behavior, not implement new checks, for 4 of 5 endpoints                                                                                                                                                              |
| 6   | Per-merge changelog + root `CHANGELOG.md` entry, calling out any disclosure fix found | Partial      | This analysis found no disclosure bug in the four `requireOwnedWallet`-backed endpoints — the changelog should say so explicitly rather than defaulting to "disclosure fix" framing the requirement suggested, unless Step 1's literal re-verification in the next phase finds something this analysis missed |
