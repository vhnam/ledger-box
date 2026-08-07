# SPDD Analysis: Locale Change Full-Screen Fade Transition

## Original Business Requirement

A full-screen transition when language changes — brief fade overlay that simulates the app "reloading" with the new language.

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **Supported locale / user locale preference**: Closed set of UI languages (`vi-VN`, `en-US`, `en-GB`, `ja-JP`, `fr-FR`, `zh-CN`, `zh-TW`) persisted in `user_settings.locale` for signed-in users. Owns “which language and regional formatting the app should use.”
- **LocaleProvider / Intl stack**: App-root provider that resolves the active locale (stored preference when signed in; browser Accept-Language when not), loads message catalogs (eager `en-US`, lazy for others), and feeds `react-intl`’s `IntlProvider`. Owns live UI string language for the whole tree.
- **Locale change mutation**: Settings Appearance language Select (`SettingsLocalePicker`) calls `useUpdateUserLocale` → PATCH user locale → query invalidation → LocaleProvider re-resolves. Owns persistence and triggering the language switch; today the UI updates in place with no transition chrome.
- **Message catalog loading**: Async, cached per locale. First switch to a non-default locale may wait on a dynamic import before strings update; subsequent switches to a cached locale are effectively sync. Owns readiness of translated copy after a locale change.
- **Full-screen overlays (presentation pattern)**: Dialog/sheet backdrops and media previews already use fixed inset overlays with fade in/out. Owns modality and visual masking for temporary UI states — closest existing pattern for a “cover the app briefly” effect, though none today is tied to locale.
- **Theme switching**: Client-local appearance change under the same Appearance settings surface; applies instantly with no overlay. Related only as a contrasting “preference change” UX already present next to language.

#### New Concepts Required

- **Locale change transition (fade overlay)**: A brief, full-viewport visual veil that appears when the user deliberately changes language, masks the mid-switch UI, and reveals the app already rendered in the new language — simulating a soft “reload” without a real browser navigation. Presentation/UX concept only; not a new persisted entity.
- **Transition lifecycle / readiness gate**: The conceptual window from “user committed a language change” through “new locale + messages are applied” (and optionally a short minimum hold) until the overlay dismisses. Coordinates mutation success, catalog readiness, and fade timing so the reveal never shows a half-translated flash.

#### Key Business Rules

- **Transition is for intentional language changes only** — not for initial app load, session bootstrap, public/unauthenticated browser-locale resolution, or theme changes.
- **Overlay must feel like a soft reload, not a hard navigation** — no full page refresh, no loss of route/scroll/form state beyond what a normal SPA locale swap already does (unless product later requires remount — currently unspecified).
- **Reveal only when the new language is ready** — the fade-out should not expose mixed old/new strings or a flash of the previous catalog; especially important on first visit to a lazily loaded locale.
- **Brief duration** — long enough to read as intentional, short enough not to feel like a blocking spinner or failure.
- **Locale persistence and resolution remain unchanged** — the transition is chrome around the existing mutate → invalidate → LocaleProvider path; it must not invent a second source of truth for locale.
- **Failure should not leave the user stuck under a veil** — if the locale update fails (or catalog load fails), the overlay must not trap the UI; existing error toast behavior for mutation failure remains the failure signal.
- **Accessibility**: Full-screen covering content implies focus/aria and motion considerations (announcement of language change, respect for reduced motion) even though the requirement does not spell them out.

## Strategic Approach

#### Solution Direction

Treat this as a **client-only UX enhancement** around the existing language-change path. Keep persistence, API, LocaleProvider resolution, and settings IA as they are. Introduce a full-viewport fade overlay that starts when the user commits a locale change from settings, stays up until the new locale (and its message catalog) are applied, then fades away to reveal the already-updated UI — producing the “app reloaded in the new language” sensation without `location.reload()` or a route remount unless later design requires it.

High-level flow: user selects new language → overlay fades in (masks current UI) → existing update-locale mutation + LocaleProvider/catalog path completes → overlay fades out on the new-language UI.

Leverage existing conventions: app-root provider composition (`LocaleProvider` in `main.tsx`), TanStack Query mutation lifecycle from `SettingsLocalePicker`, and presentational full-screen fade patterns already used by dialog/sheet overlays (Tailwind animate fade classes) — without turning this into a Dialog modal unless modality/focus trapping is explicitly desired.

#### Key Design Decisions

- **Soft overlay vs hard browser reload**: Hard reload guarantees a clean language paint but loses SPA state and feels heavier/slower. Soft overlay preserves route and query cache and matches “simulates” rather than “actually reloads.” → **Recommend soft fade overlay** over `window.location.reload()` / full remount unless product insists on true remount semantics.
- **Where transition ownership lives**: Trigger-only in the settings picker vs a shared app-level “locale transitioning” signal that LocaleProvider (or a sibling root component) drives. Picker-only is simpler but can miss catalog readiness and can’t easily cover the whole app consistently. → **Recommend app-level transition state coordinated with locale application** (picker signals intent / mutation; root-level chrome owns overlay timing and readiness), so the veil is truly full-screen and tied to when messages are ready.
- **When the overlay starts**: On select (optimistic) vs only after mutation success. Starting on select masks latency and matches “reload” theatre; starting only after success avoids overlay-on-failure but shows old UI during the network wait. → **Recommend start on committed selection (while mutation runs)**, with guaranteed teardown on error so a failed PATCH never leaves a stuck overlay.
- **When the overlay ends**: Fixed timer vs wait-for-catalog-ready (+ optional minimum duration). Fixed-only risks revealing mid-load on cold catalog fetches; ready-only with no minimum can feel like a flicker on cached locales. → **Recommend gate on locale+messages ready, with a short minimum hold** so both cold and warm switches feel intentional.
- **Overlay visual language**: Opaque brand/background veil vs translucent dim (dialog-like) vs branded splash with logo/spinner. Requirement says “brief fade overlay” and “simulates reloading” — suggests a solid or near-solid cover that hides text swap, not a light dim that lets mixed strings show through. → **Recommend opaque (or near-opaque) full-screen fade** using app background/foreground tokens; defer logo/spinner branding unless product wants a stronger “loading” cue — keep it brief and quiet by default.
- **Reuse Dialog overlay vs dedicated transition layer**: Dialog brings focus trap and dismiss semantics that fight a non-interactive veil. → **Recommend dedicated non-modal transition layer** (fixed inset, high z-index, pointer-events blocking briefly) rather than hijacking Dialog/Sheet.

#### Alternatives Considered

- **Hard page reload after successful locale save**: Rejected as primary approach — contradicts SPA architecture, drops in-memory state, and is slower; the requirement says “simulates” reloading.
- **CSS View Transitions API cross-fade of the document**: Attractive for morphing UI, but browser support and coupling to React commit timing are uneven; does not by itself wait for async catalogs. Deferred / secondary; not the recommended core mechanism for v1.
- **Only animate the settings Select / local section**: Rejected — does not deliver full-screen “app reloading” sensation; users would still see the rest of the chrome snap languages.
- **Remount the entire React tree under LocaleProvider on each change**: Heavier than needed for a brief aesthetic veil; risks resetting unrelated client state. Rejected unless later ACs demand a true remount.
- **Apply the same overlay to theme changes**: Out of scope — requirement is language-specific; theme already switches instantly and is client-only.

## Risk & Gap Analysis

#### Requirement Ambiguities

- **No formal acceptance criteria** — duration, opacity, color, branding (logo/spinner vs blank veil), and whether route/scroll state must be preserved are unspecified; product taste will drive REASONS Canvas defaults.
- **“Simulates reloading” strength** — soft veil over live SPA vs visual that implies a real remount (e.g. brief blank + remount providers). Intent is unclear beyond the fade.
- **Trigger scope** — only the Appearance language Select, or any future locale-change entry point? Today there is one signed-in mutator path; unauthenticated locale is browser-derived and does not “change” via UI.
- **Success feedback** — keep silent (overlay is the feedback), keep/add toast, or both? Current picker has error toast only; no success toast.
- **Reduced motion** — whether to skip/ shorten the animation under `prefers-reduced-motion` is not stated but is an expected a11y gap to resolve in design.
- **Screen reader announcement** — whether language change should be announced (`aria-live`) while visually veiled is unspecified.

#### Edge Cases

- **Rapid re-selection** while a transition is in flight (user opens Select again or hammers options if somehow re-enabled) — need a single in-flight transition and ignore duplicate same-locale picks (picker already no-ops same value and disables while pending).
- **Mutation failure** after overlay has started — overlay must clear; UI stays on previous language.
- **Catalog load failure / slow network** on first use of a locale — overlay duration could stretch; need a timeout or error path so the veil cannot hang indefinitely.
- **Cached vs uncached locale** — warm switches may complete in milliseconds; without a minimum hold the “reload” feeling disappears.
- **Same-language re-pick** — already no-ops; must not flash the overlay.
- **Open dialogs/sheets/toasts during transition** — z-index stacking (Toaster lives next to the router under LocaleProvider) may leave toasts visible above or below the veil; stacking order needs an explicit product choice.
- **Theme + language on the same page** — changing language should not disturb theme; overlay should not be mistaken for a theme flash (avoid pure black/white that reads as dark-mode toggle unless intentional).

#### Technical Risks

- **Async catalog gap**: LocaleProvider can update `IntlProvider`’s `locale` and `messages` on different ticks when a catalog is not cached — without a readiness gate, fade-out can still reveal a partial language swap. This is the main integrity risk for the “reload with the new language” claim.
- **Overlay vs portal z-index**: Dialogs/sheets/toasts use high z-index portals; a root-level veil must sit above app chrome and ideally above or intentionally below toasts — wrong stacking breaks the full-screen illusion.
- **Pointer blocking**: A full-screen veil should prevent interaction mid-transition; forgetting `pointer-events` allows clicks on half-updated UI.
- **No existing motion/transition primitive for app-wide locale changes** — pattern must be invented carefully to avoid one-off CSS that fights StrictMode double-effects or overlapping timers.
- **False “stuck loading” perception**: If network is slow, a long opaque veil without any affordance may look like a crash; brief duration + error teardown mitigate, but very slow PATCH/catalog cases need a policy (timeout, spinner, or cancel).

#### Acceptance Criteria Coverage

The requirement has no numbered ACs; the following are **derived** from the stated intent and used as the coverage baseline for REASONS Canvas.

| AC# | Description                                                                    | Addressable? | Gaps/Notes                                                                                        |
| --- | ------------------------------------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------- |
| 1   | When the user changes language in settings, a full-screen fade overlay appears | Yes          | Exact visual (opacity, color, branding) unspecified                                               |
| 2   | Overlay is brief and communicates a soft “reload” into the new language        | Partial      | Duration and minimum/maximum hold not specified; “reload” vs soft veil needs product confirmation |
| 3   | After the transition, the app UI is shown in the newly selected language       | Yes          | Must explicitly gate on message catalog readiness for lazy locales                                |
| 4   | Language preference remains persisted via the existing user-locale path        | Yes          | No API/schema change required                                                                     |
| 5   | Failed language updates do not leave the overlay stuck and surface an error    | Yes          | Implicit; not stated in the requirement but required for a safe approach                          |
| 6   | Non-language preference changes (e.g. theme) are unaffected                    | Yes          | Scope discipline only                                                                             |
| 7   | Accessibility / reduced-motion behavior for the transition                     | Partial      | Not in requirement; must be decided in REASONS Canvas                                             |
