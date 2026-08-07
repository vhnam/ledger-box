# SPDD Analysis: Combine Locale into Appearance Settings (Flag Dropdown)

## Original Business Requirement

please combine Locale into Appeareance tab for Settings

we add the country flag for each locale and display as Dropdown

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **User Settings shell**: Authenticated route tree at `/settings` with desktop sub-sidebar and mobile section list — currently three sections: Account, Appearance, Language (`locale`). Owns navigation and layout only; section bodies are independent modules.
- **Appearance section**: Theme preference UI (light / system / dark) on `/settings/appearance`, driven by local client theme state (`useTheme`), not server-persisted. Presented as a three-option bordered card grid.
- **Locale / Language section**: UI language + regional formatting preference on `/settings/locale`. Persisted in `user_settings.locale`, mutated via existing user-locale API/query/mutation stack. Presented today as a multi-column bordered button grid of native-language labels (no flags).
- **Supported locale**: Closed set `vi-VN`, `en-US`, `en-GB`, `ja-JP`, `fr-FR`, `zh-CN`, `zh-TW` — used for catalog loading, date/number formatting, and invite-email locale. Independent of wallet currency.
- **LocaleProvider / Intl stack**: Signed-in users resolve locale from stored preference; UI strings via `react-intl` catalogs. Locale changes already take effect by invalidating the user-locale query — no new persistence concept needed.
- **Select (Dropdown) pattern**: Shared `@vhnam/ui` Select used elsewhere for currency, wallet, and member-role pickers — the established single-value choice control when a card grid is not desired.

#### New Concepts Required

- **Locale option presentation (flag + label)**: A display concern mapping each supported locale to a country/region flag glyph plus its existing native-language label. Not a new domain entity — metadata attached to the existing locale option list for the switcher UI only.
- **Combined Appearance surface**: A single settings section that hosts both theme controls and language selection. Conceptually groups “how the app looks and reads,” without changing how theme vs locale are stored or applied.

#### Key Business Rules

- **Locale preference remains server-persisted and tenant-scoped** via existing `user_settings` — merging UI sections must not change storage, API, or effective-locale resolution.
- **Theme remains client-local** — combining tabs must not imply theme is saved with locale or vice versa.
- **Locale labels stay in each locale’s own language** (current switcher invariant) so the control remains legible regardless of the active UI language.
- **Currency stays decoupled from UI locale** — language switch must never change wallet currency display rules.
- **Settings navigation should no longer expose a standalone Language section** once locale lives under Appearance (nav, mobile list, and deep links need a coherent story).
- **Every supported locale must be choosable**, with a visible country/region flag in the dropdown trigger and options.

## Strategic Approach

#### Solution Direction

Treat this as a **settings IA + presentation refactor**, not a data-model or API change. Fold the Language section into the Appearance page as a second control group (theme card grid unchanged; language becomes a Select/dropdown with flag + native label). Remove Language from the settings shell navigation. Reuse the existing locale query/mutation and `SupportedLocale` set. Prefer the shared Select component already used for similar single-choice preferences. Keep backend, migrations, and locale resolution untouched.

High-level flow: user opens Appearance → sees theme options and a language dropdown → selecting a locale calls the existing update-locale mutation → LocaleProvider refreshes UI language as today.

#### Key Design Decisions

- **Merge UI only vs also keep `/settings/locale`**: Keeping a parallel route duplicates IA; removing without redirect breaks bookmarks/deep links. → **Recommend remove Language from nav and delete or redirect `/settings/locale` → `/settings/appearance`** so old links still land on the combined surface.
- **Dropdown control**: Custom menu vs existing Select. → **Recommend `@vhnam/ui` Select** — matches currency/role pickers, supports labeled items, already accessible patterns in-app. “Dropdown” in the requirement maps to this Select, not a free-form DropdownMenu of actions.
- **Flag representation**: Unicode regional-indicator emoji vs SVG icon pack vs image assets. → **Recommend Unicode flag emoji first** (no new dependency, trivial mapping per locale) unless design/a11y review demands SVG for consistency across platforms; defer SVG library to REASONS Canvas only if emoji rendering gaps are unacceptable.
- **Where locale UI lives after merge**: Keep a small locale sub-module composed into Appearance vs inline everything into `settings-appearance`. → **Recommend compose** (Appearance owns page chrome + theme; locale picker becomes a reusable block rendered on Appearance) so mutation/query wiring stays cohesive and the standalone route/module can be retired cleanly.
- **Copy / page description**: Appearance description today mentions only color theme. → **Recommend broaden** page description (and optionally section titles) so Appearance covers theme + language without implying they share one persistence model.

#### Alternatives Considered

- **Keep separate Language nav but restyle locale as a dropdown**: Rejected — contradicts the explicit “combine into Appearance” ask and leaves three-section IA.
- **Replace theme cards with dropdowns too for consistency**: Rejected — out of scope; theme previews are valuable and not requested to change.
- **Add a new flag/icon package immediately**: Deferred — unnecessary if emoji flags meet the requirement; avoid dependency sprawl unless platform gaps force it.
- **Change locale storage or API while merging UI**: Rejected — no business need; increases risk with zero product gain.

## Risk & Gap Analysis

#### Requirement Ambiguities

- **“Dropdown” precision**: Confirm Select (single value) vs DropdownMenu (action list). Codebase convention strongly favors Select for preference values.
- **Flag mapping for dual-region languages**: `en-US`/`en-GB` and especially `zh-CN`/`zh-TW` need an explicit flag→locale mapping (US/UK; China/Taiwan). Product should confirm this is acceptable; Taiwan/China flag choice can be sensitive.
- **`/settings/locale` fate**: Redirect vs hard remove vs temporary dual support — not specified.
- **i18n key strategy**: Whether to retire `settings.nav.locale` / standalone locale page strings or keep keys for reuse under Appearance subsections — not specified.
- **Mobile IA**: With Language removed, mobile settings list becomes Account + Appearance only — confirm that is intended.
- **Loading / error UX**: Current locale page shows a spinner while preference loads; Appearance (theme) does not. How the combined page should behave while locale is pending is unspecified.

#### Edge Cases

- **Deep link or bookmark to `/settings/locale`**: Users or docs may still navigate there after Language disappears from nav.
- **Selecting the already-active locale**: Current UI no-ops; dropdown should preserve that (no redundant mutation).
- **Mutation in flight**: Current UI blocks re-entry while pending; dropdown should disable or ignore changes during pending to avoid races.
- **Platforms with poor emoji flag support** (notably some Windows versions historically): flags may render as letters (e.g. `US`) — visual requirement may degrade.
- **Accessibility**: Flag alone is insufficient; option text (native label) and an accessible name for the control must remain.

#### Technical Risks

- **Route tree / shell coupling**: `SETTINGS_SECTIONS` hardcodes three sections including `locale`; mobile “list vs detail” logic keys off `account` as the list root — removing a section is straightforward but must update shell, routes, and generated route tree consistently.
- **No existing flag infrastructure**: Any approach is net-new presentation metadata; keep it app-local to the settings locale picker, not a utils/domain concept, unless reused later.
- **Select item richness**: Existing Select usages are text-only; flag+label items need a quick check that SelectItem layout supports inline media without clipping (presentation detail for REASONS Canvas).
- **Scope creep into theme persistence**: Combining sections may tempt unifying persistence — must not; theme and locale lifecycles stay different.

#### Acceptance Criteria Coverage

No formal numbered ACs were supplied. Coverage below is derived from the stated requirement.

| AC# | Description                                                                              | Addressable? | Gaps/Notes                                                     |
| --- | ---------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------- |
| 1   | Locale/Language controls live on the Appearance settings surface                         | Yes          | Requires shell nav update + page composition                   |
| 2   | Standalone Language settings section is no longer a primary nav destination              | Yes          | Confirm redirect vs delete for `/settings/locale`              |
| 3   | Each supported locale shows a country/region flag                                        | Yes          | Need explicit flag mapping; political/UX sensitivity for CN/TW |
| 4   | Locale is chosen via a Dropdown (single-select) rather than the current option card grid | Yes          | Map to existing Select pattern                                 |
| 5   | Changing locale still updates the persisted preference and live UI language              | Yes          | Reuse existing mutation/query/LocaleProvider — no API change   |
| 6   | Theme controls remain available and functional on Appearance                             | Yes          | Leave theme card grid as-is unless design asks otherwise       |
