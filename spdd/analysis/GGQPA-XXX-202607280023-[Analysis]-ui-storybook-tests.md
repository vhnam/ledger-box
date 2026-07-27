# SPDD Analysis: UI Component Tests via Storybook

## Original Business Requirement

write test cases for `@packages/ui/` via `@apps/storybook/`

**Project context (from `AGENTS.md` and package READMEs):**

- `@vhnam/ui` (`packages/ui`) is the shared presentational component library — shadcn-style components on Base UI, Tailwind CSS v4, and Phosphor Icons. No business logic; subpath imports only (`@vhnam/ui/components/<name>`).
- `@vhnam/storybook` (`apps/storybook`) hosts one story file per UI component in `src/stories/<component>.stories.tsx`, following a consistent `Meta`/`StoryObj` pattern with `centered` layout and `autodocs` tag.
- Convention: every new component in `packages/ui` must ship with a matching Storybook story in the same change.
- The monorepo uses Vite+ (`vp`) with Vitest available via `vp test`. `AGENTS.md` requires `vp check && vp test` before every commit. The root `ready` script runs `vp check && vp run -r test && vp run -r build`.
- **Current state:** 33 components in `packages/ui/src/components/`, 33 matching story files in `apps/storybook/src/stories/`. Zero `*.test.*` or `*.spec.*` files anywhere in the repo. `vp test run` exits with "No test files found". Storybook has `@storybook/addon-a11y` installed but `preview.tsx` sets `a11y.test: 'todo'` (violations are not enforced). No `play` functions exist in any story. Storybook is on v10.5.0 (`@storybook/react-vite`).

**Inferred acceptance criteria (not explicitly stated — derived from requirement + project conventions):**

1. Automated tests for `@vhnam/ui` components are runnable headlessly via `vp test` (no manual `storybook dev` step for the default CI path).
2. Tests are authored through the existing Storybook app (`apps/storybook`), reusing or extending current stories — not a parallel test-only harness in `packages/ui`.
3. Components with custom behavior beyond static rendering (`currency-input`, `toast`, `date-picker`, `date-picker-range`, `attachment`, `dialog`, `select`, `sidebar`) have interaction tests that assert user-visible outcomes.
4. All other components have at minimum a render/smoke assertion so every story-backed component is covered.
5. Accessibility checks enforced by `@storybook/addon-a11y` fail the test run (upgrade from `todo` to `error` or equivalent).
6. Tests do not depend on `apps/ledger-box` (no wallet, tenant, auth, or API context).
7. Adding a new UI component continues to require a story; the workflow extends to include test coverage (play function or equivalent) in the same change.
8. Test setup integrates with the existing Vite+ toolchain and does not break `vp check`.

## Domain Concept Identification

### Existing Concepts (from codebase)

- **UI Component (`@vhnam/ui`)**: Presentational React component, one file per component under `src/components/`. Built on Base UI primitives, styled with Tailwind. Exports via package subpaths. Includes two hooks (`use-mobile`, `use-theme`) and one utility (`cn` in `lib/utils.ts`). `currency-input` delegates formatting/parsing to `@vhnam/utils/currency`.
- **Storybook Story (`@vhnam/storybook`)**: CSF3 story file (`Meta` + `StoryObj`) per component. Imports components from `@vhnam/ui`. Uses `@vhnam/ui/vite` plugin in `.storybook/main.ts` for `#/` alias resolution. Supports `args`-based and `render`-based variants, decorators (e.g. toast `Toaster`), and `argTypes` for controls.
- **Storybook Addons**: `@storybook/addon-docs` (autodocs) and `@storybook/addon-a11y` (accessibility panel; currently non-blocking).
- **Vite+ Test Runner (`vp test`)**: Vitest v4 wrapper at workspace root. Default glob `**/*.{test,spec}.?(c|m)[jt]s?(x)`. No project-specific vitest config file exists; root `vite.config.ts` configures fmt/lint/run only.
- **UI Vite Plugin (`@vhnam/ui/vite`)**: Resolves `#/` imports for both the UI package and consuming apps. Required for Storybook and ledger-box to import UI source correctly.

### New Concepts Required

- **Story Interaction Test (play function)**: Executable user-interaction script co-located in a story, asserting DOM state, callbacks, or accessibility after simulated events. Becomes the primary test artifact for UI components.
- **Storybook Test Configuration**: Vitest + Storybook integration wiring (browser test environment, story discovery, project reference to `apps/storybook`) so `vp test` executes story tests without a separate Playwright test-runner process.
- **Test Coverage Tiers**: Convention distinguishing (a) smoke/render tests for static components, (b) interaction tests for stateful/custom components, and (c) a11y assertions applied globally via addon config.
- **Test Utilities / Setup**: Shared test helpers for wrapping components that need providers (`ThemeProvider`, `Toaster`, `SidebarProvider`) — may extend existing story decorators rather than duplicating setup.

### Key Business Rules

- **Presentation-only boundary**: UI tests must not import ledger-box modules, mock tenants, or assert wallet/transaction behavior. Currency formatting logic lives in `@vhnam/utils`; UI tests assert component I/O (display value, callbacks), not utility unit behavior.
- **Story parity**: Every component in `packages/ui/src/components/` already has a story; tests should maintain 1:1 coverage — a component without executable test coverage is a gap.
- **Convention preservation**: `#/` imports in UI source, `toast.add` imperative API, Formisch/Valibot patterns apply to ledger-box only — UI tests use Storybook/React testing patterns, not app form libraries.
- **CI gate**: `vp test` must pass as part of the existing pre-commit workflow; introducing flaky browser tests or long-running Playwright suites conflicts with current `ready` script expectations.
- **No visual regression scope (unless added later)**: Stories exist for visual review in dev; this requirement targets behavioral and a11y tests, not screenshot/Chromatic comparison unless explicitly expanded.

## Strategic Approach

### Solution Direction

Introduce **Storybook-native interaction tests** powered by **Vitest in browser mode** (Storybook 10's `@storybook/addon-vitest` ecosystem), co-located as `play` functions in existing story files under `apps/storybook`. Wire a Vitest project config so `vp test run` discovers and executes these tests headlessly. Leverage the already-installed `@storybook/addon-a11y` by promoting `a11y.test` from `todo` to `error` so accessibility violations fail the suite globally.

Data flow: **story file** (component import + render) → **play function** (simulate user, assert DOM/a11y) → **Vitest browser runner** (via Storybook addon) → **`vp test`** (CI/local gate). No new test files in `packages/ui` unless a hook/utility lacks a story surface.

### Key Design Decisions

- **Storybook Vitest addon vs. `@storybook/test-runner` (Playwright)**: Storybook Vitest runs play functions inside Vitest's browser mode, reusing the same Vite config and integrating with `vp test` out of the box. Test-runner requires a running/built Storybook instance and a separate Playwright process — heavier CI, duplicates the toolchain. → **Recommend Storybook Vitest addon** to honor "via storybook" and align with existing `vp test` workflow.

- **Play functions in stories vs. separate `*.test.tsx` in `packages/ui`**: Separate unit tests would duplicate render setup already in stories and violate the "via storybook" constraint. Play functions keep tests co-located with visual documentation and enforce the "story + test in same change" convention. → **Recommend play functions in `apps/storybook/src/stories/`**.

- **Smoke coverage strategy**: Running every story as a render smoke test (via addon story test) provides baseline coverage for all 33 components without hand-writing 33 play functions. Interaction play functions added selectively for components with non-trivial behavior. → **Recommend tiered coverage: global story render tests + targeted play functions**.

- **a11y enforcement level**: `a11y.test: 'todo'` means violations are visible but ignored in CI. Changing to `error` makes a11y a hard gate but may surface many violations in complex components (sidebar, dialog, date-picker). → **Recommend `error` with a phased rollout**: fix or annotate known violations per component rather than permanently staying on `todo`\*\*.

- **Where Vitest config lives**: Root `vite.config.ts` has no test block today. Options: root vitest workspace config referencing `apps/storybook`, or `apps/storybook/vitest.config.ts` included by root. → **Recommend config in `apps/storybook`** (owns Storybook + test plugin setup) with root/workspace inclusion so `vp test` from repo root still works.

- **Custom component test depth**: `currency-input` (caret position, formatted display, `onValueChange`), `toast` (imperative `toast.add`, variants, promise helper), `date-picker`/`date-picker-range` (calendar navigation, selection), `dialog`/`sheet` (open/close, focus trap), `attachment` (state variants) warrant interaction tests. Static components (`separator`, `skeleton`, `badge`) need only render smoke. → **Recommend prioritizing ~8–10 components for interaction plays; smoke for the rest**.

- **Hook testing (`use-mobile`, `use-theme`)**: No dedicated hook stories; `use-theme` is exercised via `theme-provider.stories.tsx`, `use-mobile` via `sidebar`. → **Recommend testing hooks indirectly through their component stories** rather than isolated hook unit tests in `packages/ui`.

#### Alternatives Considered

- **React Testing Library unit tests in `packages/ui`**: Rejected — duplicates story setup, doesn't use Storybook, conflicts with stated requirement path.
- **`@storybook/test-runner` only**: Rejected — separate Playwright dependency, doesn't integrate cleanly with `vp test`/Vitest, slower CI.
- **Manual Storybook interaction only (no automation)**: Rejected — `vp test` already expected in workflow but currently no-op; requirement explicitly asks for test cases.

## Risk & Gap Analysis

### Requirement Ambiguities

- **"Test cases" scope undefined**: Unclear whether the requirement includes visual regression (screenshots), a11y-only, interaction-only, or all three. Analysis assumes behavioral + a11y; visual regression is out of scope unless Chromatic or similar is added.
- **Coverage threshold not specified**: No line/branch coverage target stated. Story-based smoke + selective interaction tests may not satisfy a numeric coverage gate if one is introduced later.
- **Flaky test tolerance**: Browser-mode tests for date-picker (locale/timezone), toast (timers), and sidebar (viewport) can be flaky without careful mocking. No SLA for test stability was given.
- **Whether `@vhnam/utils` currency logic needs separate tests**: `currency-input` depends on utils; UI play tests verify end-to-end input behavior but won't unit-test edge cases in `parseCurrencyInput`. Scope boundary unclear.

### Edge Cases

- **Portal-based components** (dialog, popover, dropdown-menu, sheet, toast): Content renders outside story root DOM; assertions must use `screen` queries within document, not story container only.
- **Async behavior** (`toast.promise`, toast auto-dismiss, spinner states): Tests need `waitFor` / fake timers; `WithPromise` story uses 2s timeout — tests must not slow CI disproportionately.
- **Date components with `new Date()`**: Stories like `date-picker` use `new Date(2026, 6, 15)` — tests must pin dates or mock `Date` to avoid environment-dependent failures.
- **`useIsMobile` viewport sensitivity**: Sidebar stories use fullscreen layout; tests run at a fixed viewport — mobile vs desktop branches may differ from dev browsing.
- **External image URLs in attachment stories**: `github.com/shadcn.png` used in stories — network dependency in browser tests if images are fetched (may need mock or local fixture).
- **Base UI `render` prop pattern**: Components like `DialogTrigger render={<Button />}` use non-standard composition; interaction tests must target accessible roles/labels, not implementation-specific selectors.
- **Theme/dark mode**: `ThemeProvider` story toggles theme; tests should set a consistent theme in preview decorators to avoid color-contrast a11y variance.

### Technical Risks

- **Greenfield test infrastructure**: Zero existing tests or vitest config — first PR must bootstrap addon, browser provider (Playwright or WebdriverIO for Vitest browser mode), and CI dependencies. Risk of underestimated setup effort.
- **Storybook 10 + Vite+ compatibility**: Project uses `vite` aliased to `@voidzero-dev/vite-plus-core@0.2.4`. Storybook Vitest addon must work with this Vite fork; version pinning in `pnpm-workspace.yaml` catalog may need new entries (`@storybook/addon-vitest`, `vitest-browser-*`, `@testing-library/*`).
- **No `test` script on `@vhnam/storybook`**: Today only `dev` and `build` scripts exist. Root `vp run -r test` may not reach storybook unless vitest config is at root or storybook package gains a `test` script.
- **a11y `error` mode blast radius**: Enabling strict a11y may fail dozens of stories on day one (missing labels, color contrast in dark mode, keyboard traps). Needs triage plan.
- **Tailwind/CSS in test environment**: Browser tests must load `style.css` and UI globals (already imported in preview) or class-based assertions will be misleading.
- **`#/` alias in test context**: `@vhnam/ui/vite` plugin must be active in the Vitest/Storybook test Vite config — same as `.storybook/main.ts` `viteFinal`.

### Acceptance Criteria Coverage

| AC# | Description                                       | Addressable? | Gaps/Notes                                                                              |
| --- | ------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------- |
| 1   | Tests runnable headlessly via `vp test`           | Yes          | Requires Vitest + Storybook addon bootstrap; not possible today without new config/deps |
| 2   | Tests authored through `apps/storybook`           | Yes          | Play functions in existing story files satisfy this                                     |
| 3   | Custom-behavior components have interaction tests | Yes          | ~8–10 components need explicit play functions; scope must be agreed                     |
| 4   | All other components have render/smoke coverage   | Yes          | Addon can run all stories as smoke tests; verify 33/33 included                         |
| 5   | a11y violations fail test run                     | Partial      | Addon supports this; likely needs per-story fixes before `error` is viable              |
| 6   | No ledger-box dependencies                        | Yes          | Stories already import only `@vhnam/ui`; maintain boundary                              |
| 7   | New component workflow includes tests             | Partial      | Documented in README/AGENTS.md update needed; not automatic                             |
| 8   | Integrates with Vite+ without breaking `vp check` | Yes          | Test config should be isolated; verify oxlint/typecheck unaffected                      |
