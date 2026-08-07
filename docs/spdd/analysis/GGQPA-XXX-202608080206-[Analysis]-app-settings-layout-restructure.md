# SPDD Analysis: App Settings Page — Layout Restructure

## Original Business Requirement

```
App Settings Page — Layout Spec

A two-panel settings layout rendered inside the main app shell (which already has a left sidebar and a top header bar).

Top header bar (desktop)

Height: h-14 (56px), border-b
Left: page title "Settings" (text-base font-semibold), no subtitle
Background: bg-card
Below the header: two-column flex row, fills remaining height

Left panel — Settings sub-sidebar

Width: w-52, border-r, bg-card, overflow-y-auto
Header strip: h-14 flex items-center px-4 border-b — label "SETTINGS" in text-[10px] font-semibold uppercase tracking-widest text-muted-foreground
Nav items below the strip, each flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium w-full. Active item: bg-secondary text-foreground with a ChevronRight icon pushed to the right (ml-auto opacity-40). Inactive: text-muted-foreground hover:bg-muted hover:text-foreground
Nav items: Account (UserCircle icon), Appearance (Monitor icon)
Right panel — Content area

w-full flex-1 overflow-y-auto
Inner outlet wrapper: w-full flex justify-center px-8 py-6
Content constrained to w-full max-w-2xl — centered in the panel
Content starts with h2 text-lg font-semibold section title + p text-sm text-muted-foreground subtitle, then space-y-8 stacked cards
Account section cards:

bg-card rounded-2xl border border-border overflow-hidden — "Sign-in methods" with email/password row + OAuth provider rows (Google, GitHub, Apple), each flex items-center gap-4 px-5 py-3.5 with divide-y divide-border
bg-card rounded-2xl border border-destructive/30 overflow-hidden — "Delete account" danger card with bg-destructive/5 header
Appearance section cards:

"Language" card — <select> with country flag emoji + native language name per option, styled appearance-none bg-muted rounded-xl px-4 py-2.5 pr-10, ChevronDown icon overlaid absolute right. Changing language triggers a full-screen bg-background fade overlay (400ms) via motion.div
"Theme" card — three-column grid (Light / System / Dark), each a bordered button with a mini preview swatch, icon, label, and checkmark when active. Active border: border-2 border-foreground
Mobile: Sub-sidebar collapses to a list page → drill into section → back button restores the list.
```

Supporting visual references (attached screenshots):

1. **Account** — dark-theme settings chrome with global left rail, settings sub-sidebar (Account active with trailing chevron; Appearance inactive), centered content: “Account” title + subtitle “Manage your sign-in methods and account lifecycle.”; “Sign-in methods” bordered card with email/password + Google/GitHub/Apple rows; “Delete account” danger card with reddish border and destructive CTA.
2. **Appearance** — same chrome with Appearance active; “Appearance” title + subtitle “Customize language and visual preferences.”; Language card with flag-emoji dropdown; Theme card with Light / System / Dark preview buttons (System selected with checkmark).

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **App settings route tree** (`routes/_app/settings/`): Authenticated layout at `/settings` with index redirect to `/settings/account`, leaf routes for `account` and `appearance`, and legacy `/settings/locale` redirecting to appearance. Already deep-linkable; this requirement does not introduce new sections or URLs as primary work.
- **Settings shell layout** (`modules/settings/settings-shell-layout/`): Owns desktop sub-sidebar, mobile section list / drill-in, back affordance, and outlet framing. Currently: no desktop page header bar; sub-sidebar `md:w-64` with Back + uppercase “Settings” label; active nav uses `bg-accent` without trailing chevron; content wrapper `max-w-4xl` left-biased inside scroll area. This is the primary concept to restructure.
- **Settings navigation sections** (static config in the shell): Account + Appearance only (Language already folded into Appearance). Icons today are `UserIcon` / `PaletteIcon` (Phosphor registry), not the spec’s UserCircle / Monitor labels.
- **Settings Account section** (`modules/settings/settings-account/`): Sign-in methods card (email/password + Google only), change-password collapsible, Google connect/disconnect, delete-account flow with owned-wallet gate. Presentation uses shared `Card` primitives and a flat delete section — not yet the bordered danger card from the spec/screenshots.
- **Settings Appearance section** (`modules/settings/settings-appearance/` + `settings-locale/`): Theme three-column preview grid (already matches active `border-2 border-foreground` + checkmark pattern) and Language picker via `@vhnam/ui` Select with flag emoji + native labels. Card order today is Theme then Language; screenshots/spec put Language first.
- **Locale change fade overlay** (`lib/locale/locale-change-overlay.tsx` + `locale-transition.tsx`): Full-screen `bg-background` veil already exists for intentional locale changes (with reduced-motion handling and live region). Implemented with CSS opacity transition (`FADE_IN_MS = 150`, `FADE_OUT_MS = 180`), not `motion.div` / 400ms as written in the layout spec.
- **App shell / wallet shell precedents** (`layouts/app-layout/`, `modules/wallets/wallet-shell-layout/`, `wallet-header`): Settings render inside `SidebarInset` under the global sidebar; wallet pages use a dedicated header bar (`h-(--header-height)`, border-b) above a two-column body. The requested settings page header is conceptually analogous to that page chrome, scoped to `/settings` rather than wallet context.
- **Icon registry** (`packages/ui` Phosphor allowlist): Curated `IconName` set including `UserIcon`, `DesktopIcon` (monitor-like), `CaretRightIcon` / `CaretDownIcon`, `KeyIcon`, `EnvelopeSimpleIcon`. No literal `UserCircle` / `Monitor` / `ChevronRight` names — Phosphor equivalents map into the existing registry pattern.
- **i18n message catalog** (`settings.page.*`, `settings.nav.*`, `settings.account.*`, `settings.appearance.*`, `settings.locale.*`): Section titles, nav labels, and most card copy already exist; subtitle copy in the screenshots differs from current defaults and may need catalog updates as presentation work.

#### New Concepts Required

- **Settings page header (desktop)** — A settings-scoped top bar (“Settings”, `h-14`, `bg-card`, `border-b`) sitting above the sub-sidebar + content row. Relates to the existing shell as new chrome; does not replace the global app sidebar. Distinct from the current Back link currently living inside the sub-sidebar.
- **Settings content frame** — Centered outlet constraint (`max-w-2xl`, horizontal padding, stacked `space-y-8` cards) as a shell responsibility so Account/Appearance sections share one composition rhythm. Relates to existing section modules by shrinking their outer layout concerns (title/subtitle + cards) while leaving mutation/query ownership in place.
- **Active-nav chevron affordance** — Presentational active-state marker on desktop nav items (trailing caret). Relates only to navigation chrome, not routing.
- **Delete-account danger card** — Reshapes the existing delete lifecycle UI into a bordered destructive card (header tint + warning body + CTA). Same business concept as today’s delete flow; new presentation boundary only.
- **Native-select language control (spec surface)** — Spec/screenshots describe a native `<select>` with overlaid ChevronDown. Conceptually still the existing Language preference; may map onto either a restyled native control or the current shared Select, resolved as a design decision (below).

#### Key Business Rules

- **Layout-only for settings chrome**: Restructure must not change tenancy, auth session, wallet balances, or soft-delete money rules. Settings remain user/tenant preferences + account lifecycle UI.
- **Supported sign-in methods stay capability-true**: Only methods actually wired in better-auth (email/password + Google today) should present live actions. GitHub/Apple rows in the reference screenshots are visual aspirational chrome unless auth providers are explicitly expanded — fabricating Connect buttons would violate prior sign-in-methods scope decisions.
- **Locale remains server-persisted; theme remains client-local**: Combining Language under Appearance already encodes this; layout reorder must not merge persistence models.
- **Locale labels stay in each locale’s own language** with visible flag glyphs — existing switcher invariant.
- **Owned-wallet gate on account deletion** remains: users who own wallets cannot delete until ownership is resolved; presentation may change but the gate must not weaken.
- **Mobile list → section → back** must preserve deep links and avoid trapping users without a way back to the section list or out of settings.
- **UI strings go through `react-intl`**; brand name “Ledger Box” stays untranslated; do not put intl inside `@vhnam/ui`.

## Strategic Approach

#### Solution Direction

Treat this as a **settings shell + section presentation restructure** inside the existing `/settings` route tree — not a new feature domain and not a backend/API change. Primary work centers on `SettingsShellLayout` (page header, sub-sidebar dimensions/styling, active chevron, centered content frame, mobile list/drill alignment) and light presentation passes on Account/Appearance cards so they match the reference composition (title scale, card radii/borders, Language-before-Theme order, danger delete card).

Reuse established patterns: TanStack file routes as-is; section modules keep their query/mutation/actions; locale fade overlay stays the existing transition system (adapt timing/visual if needed rather than introducing a parallel animation stack); Phosphor icons via the curated registry; FormattedMessage for copy updates.

High-level flow: user opens Settings from sidebar → desktop shows Settings header + Account/Appearance nav + centered section content; mobile shows section list first, drills into a section route, back restores the list; language change continues to use the full-screen background fade already in the app.

#### Key Design Decisions

- **Where the “Settings” title lives (page header vs sub-sidebar only)** → Spec wants a dedicated desktop top header bar plus a separate “SETTINGS” strip in the sub-sidebar; current UI puts Back + title only in the sub-sidebar and has no desktop page header. Trade-off: matching the two-tier chrome (closer to screenshots/spec) vs. minimizing chrome duplication with wallet header patterns. → **Recommend introduce a settings page header for desktop and keep a compact “SETTINGS” strip in the sub-sidebar**, relocating/rethinking the current Back control so it does not fight the new header (mobile retains Back as the primary exit/drill control).
- **Content width & centering (`max-w-2xl` centered vs current `max-w-4xl`)** → Narrower centered column matches the attached references and the written spec; wider column uses more horizontal space on large displays. → **Recommend adopt centered `max-w-2xl` in the shell outlet wrapper** so both sections inherit one frame.
- **OAuth rows shown in screenshots (GitHub, Apple) vs capability-backed rows** → Showing Connect for unimplemented providers is a broken affordance; omitting them diverges from the attached mock. Prior analysis already scoped Account to Email/Password + Google. → **Recommend keep capability-true rows only (Email/Password + Google)** for this layout pass; treat GitHub/Apple as out-of-scope unless a separate auth-provider requirement is accepted.
- **Language control: native `<select>` (spec) vs existing `@vhnam/ui` Select** → Native select matches the layout-spec CSS literally; shared Select matches a11y/focus patterns and current codebase conventions. Screenshots look like a full-width muted control, which either can approximate. → **Recommend restyle the existing Select to the muted rounded full-width look** rather than replacing it with a raw `<select>`, unless REASONS Canvas finds a hard visual gap that only native styling can close.
- **Locale fade: honor “400ms motion.div” literally vs keep existing overlay** → Existing overlay is purpose-built (reduced motion, spinner, announcer, z-index above dialogs). Introducing Motion solely for this page adds dependency/surface for little gain. Spec’s “400ms” conflicts with current 150/180 fade constants. → **Recommend keep the existing overlay architecture**; if visual timing must feel closer to the mock, adjust fade durations as a constrained tweak in the locale-transition module — do not fork a second overlay.
- **Nav icons (UserCircle / Monitor wording vs Phosphor names)** → Registry has `UserIcon` and `DesktopIcon` (monitor-like), not Lucide-style names. → **Recommend map Account → User (or UserCircle if added to registry) and Appearance → DesktopIcon**, adding a new Phosphor icon to the allowlist only if the visual gap vs the mock is material.
- **Card primitives vs hand-rolled bordered panels** → Spec describes `rounded-2xl border` panels; app already uses `Card`/`CardHeader`/`CardContent`. → **Recommend keep Card primitives and adjust classNames** (radius, overflow, destructive border treatment) rather than inventing parallel panel components.
- **Section title hierarchy (`h2 text-lg` in spec vs current `h1 text-2xl`)** → Spec is tighter; screenshots still read as a strong page title. → **Recommend align to the written layout rhythm (`text-lg` section title + muted subtitle, no heavy border-b divider)** for consistency with the centered card stack, accepting a modest visual downshift from today’s larger heading.

#### Alternatives Considered

- **Rebuild settings as a greenfield layout outside `SettingsShellLayout`**: Rejected — routes and section modules already exist; a parallel shell would duplicate mobile drill logic and navigation config.
- **Mirror wallet settings mobile dropdown instead of list→drill**: Rejected — the requirement explicitly asks for list → drill → back, which the current settings shell already approximates and which matches the attached IA better than wallet’s dropdown.
- **Implement GitHub/Apple Connect rows as part of this layout ticket**: Rejected — auth capability does not exist; prior SPDD for sign-in methods explicitly scoped them out. Layout restructure should not invent auth providers.
- **Replace locale fade with Framer/Motion `motion.div`**: Rejected as default — existing overlay already satisfies the product behavior; Motion would be an unnecessary stack addition for a timing constant change.
- **Widen content to match wallet pages (`max-w-4xl`)**: Rejected relative to this requirement — written spec and screenshots both call for a narrower centered settings reading column.

## Risk & Gap Analysis

#### Requirement Ambiguities

- **Reference UI vs Ledger Box shell**: Screenshots show a multi-workspace left rail (letter avatars C/T/K/D) and a floating help control that do not exist in Ledger Box. Ambiguity: is the ask strictly the settings two-panel composition inside the _existing_ app shell, or also to reshape global navigation chrome? Assumed: settings composition only.
- **GitHub / Apple rows**: Present in Account screenshot and layout bullet list, but not backed by better-auth providers. Needs explicit product confirmation if this layout pass should show disabled placeholders, omit them, or unlock a new auth epic.
- **“Top header bar” interaction with Back**: Spec’s desktop header is title-only; current shell uses Back in the sub-sidebar. Unclear whether desktop Back remains, moves into the header, or disappears in favor of sidebar-only exit.
- **Native `<select>` vs design-system Select**: Spec CSS is written for native select; the app standard is shared Select. Needs a visual acceptance call during REASONS Canvas / implementation review.
- **Fade duration “400ms”**: Conflicts with shipped locale transition timings (150/180 + min cover 350). Unclear whether 400ms is a hard acceptance criterion or mock-approximate language.
- **Subtitle copy**: Screenshots use specific strings (“Manage your sign-in methods and account lifecycle.” / “Customize language and visual preferences.”) that differ from current catalog defaults — confirm whether copy updates are in scope with layout.
- **Delete card warning body**: Screenshot includes stronger irreversible-data copy (“cannot be undone”) beyond today’s shorter hint; confirm whether copy/structure of the danger card is part of this layout pass.

#### Edge Cases

- **Mobile deep-link to `/settings/appearance`**: Must open the section content (not the list) and still allow Back to restore the list without losing the ability to leave Settings entirely.
- **Mobile list visibility currently keyed off `account` + local `mobileSectionOpened` state**: Fragile if new sections appear or if users land on Appearance first — risk of incorrect list/content toggling after restyle.
- **Owned wallets blocking delete**: Danger card must still disable CTA and surface ownership guidance; restyling must not hide that gate.
- **Locale change during dialogs / pending mutations**: Existing overlay z-index and single-flight transition handle this; restyling Language control must not bypass `beginTransition` / pending guards.
- **Reduced motion**: Any fade timing change must continue respecting `prefers-reduced-motion`.
- **Very narrow desktop widths near `md` breakpoint**: `w-52` sub-sidebar + centered `max-w-2xl` content may feel tight; need a clear breakpoint story so mobile list and desktop two-panel do not fight.

#### Technical Risks

- **Shell height math**: Current body uses `h-[calc(100vh-var(--header-height))]`; adding an internal `h-14` settings header changes remaining-height distribution and scroll ownership (sub-sidebar vs content). Incorrect calc can produce double scrollbars or clipped outlets.
- **Token mismatch**: Spec cites `h-14` while app CSS uses `--header-height` / `--sub-header-height` spacing tokens that are not always 56px across breakpoints — visual drift if hard-coded classes fight tokens.
- **Icon registry additions**: New circle-user / monitor icons require allowlist updates in `@vhnam/ui` (and Storybook if interactive pieces move).
- **i18n catalog drift**: New/changed subtitles and “SETTINGS” strip label need all SupportedLocale message files updated consistently.
- **Scope creep into Account auth features**: Screenshot-driven implementation pressure to add GitHub/Apple could expand this from layout into auth product work.
- **Animation dependency**: Interpreting `motion.div` literally could pull in a motion library the app does not currently use for locale transitions.

#### Acceptance Criteria Coverage

| AC# | Description                                                                   | Addressable? | Gaps/Notes                                                              |
| --- | ----------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------- |
| 1   | Two-panel settings layout inside existing main app shell                      | Yes          | Assumes no global sidebar redesign from screenshots                     |
| 2   | Desktop top header bar: h-14, border-b, “Settings”, bg-card, no subtitle      | Yes          | Back-button placement relative to header needs clarification            |
| 3   | Sub-sidebar w-52, border-r, bg-card, SETTINGS strip styling                   | Yes          | Map typography tokens carefully vs existing uppercase label             |
| 4   | Nav items Account / Appearance with active bg-secondary + trailing chevron    | Yes          | Icon names map to Phosphor registry equivalents                         |
| 5   | Content area scrollable; outlet centered with max-w-2xl and padding           | Yes          | Replaces current max-w-4xl framing                                      |
| 6   | Section title + subtitle then space-y-8 stacked cards                         | Yes          | Copy may need catalog updates to match screenshots                      |
| 7   | Account Sign-in methods card with divided rows                                | Partial      | Email/Password + Google addressable; GitHub/Apple not capability-backed |
| 8   | Delete account danger card (destructive border / tinted header)               | Yes          | Preserve owned-wallet gate; confirm expanded warning copy               |
| 9   | Appearance Language card with flag + native name control                      | Yes          | Prefer restyled shared Select unless native select mandated             |
| 10  | Language change triggers full-screen bg-background fade (~400ms / motion.div) | Partial      | Overlay exists; Motion + exact 400ms conflict with current timings      |
| 11  | Theme card three-column Light/System/Dark with active border + checkmark      | Yes          | Largely already implemented; may only need card chrome / order          |
| 12  | Language card before Theme card (per screenshots)                             | Yes          | Current order is Theme then Language — reorder                          |
| 13  | Mobile: sub-sidebar collapses to list → drill → back restores list            | Yes          | Existing pattern needs hardening around deep links / state              |

## Suggested scope boundary for REASONS Canvas

In scope: settings shell chrome (header, sub-sidebar, content frame, mobile list/drill), Account/Appearance presentational alignment (card chrome, title/subtitle, Language/Theme order, danger delete card), icon/copy/token adjustments needed for visual parity.

Out of scope unless separately confirmed: new OAuth providers (GitHub/Apple), global app-rail redesign from screenshots, replacing locale overlay with Motion, API/schema changes, wallet-settings layout changes.
