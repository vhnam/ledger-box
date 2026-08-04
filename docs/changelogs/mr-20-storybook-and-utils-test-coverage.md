# MR 20 — Storybook & `@vhnam/utils` Test Coverage, Link Color-Contrast Fix

**Branch:** `test/storybook-coverage` → `main`

### Context

`apps/storybook`'s vitest coverage report only measured files inside the storybook app
itself (`.storybook/**`, `src/**`), so it showed `.storybook` at ~25% and said nothing
about the actual component library (`@vhnam/ui`) the stories exist to test — coverage
was effectively meaningless. Separately, `packages/utils` (currency/date formatting
helpers consumed by `@vhnam/ui`) had no test setup of its own at all. Fixing both
surfaced a real bug along the way: the `Badge`/`Button` `link` variant failed a
color-contrast a11y check in dark mode.

### Added

- `packages/utils` gained its own test setup: `vitest.config.ts` (node environment,
  v8 coverage over `src/**/*.ts`, excluding `index.ts`/`types.ts`/`constants.ts`),
  `test`/`test:watch`/`test:coverage` scripts, and three new suites —
  `currency/input.test.ts`, `currency/utils.test.ts`, `date/utils.test.ts` (71 tests
  total) — covering `parseCurrencyInput`/`formatCurrencyInput`/
  `getCurrencyInputCaretPosition`, `formatCurrency`/`formatShortCurrency`/
  `formatSignedCurrency`/`roundCurrencyAmount`/`toCurrencyAmount`, and the `date-fns`
  wrapper functions (`formatDate*`, `isDateInRange`, `getTodayRange`, etc.).
- `--link` design token (`packages/ui/src/styles/globals.css`): aliases to `--primary`
  in light mode (no visual change — light-mode `--primary` on white already measures
  ~6.8:1), but resolves to a brighter blue in dark mode (`oklch(0.623 0.214 259.815)`,
  the same value already used for `--sidebar-primary` dark) instead of reusing
  `--primary` directly.
- `play` functions added/extended across 10 story files (`calendar`, `currency-input`,
  `date-picker`, `date-picker-range`, `dropdown-menu`, `field`, `popover`, `select`,
  `sidebar`, `toast`) to actually exercise interactive code paths — opening
  menus/popovers/selects, keyboard nav, toggling checkboxes/radios, submenu
  hover, date selection across months, dismissal via Escape/outside-click — since a
  story with no `play` function only renders its closed/default state.

### Fixed

- **Color contrast, `Badge`/`Button` `link` variant** (`packages/ui/src/components/
badge.tsx`, `button.tsx`): both used `text-primary` for standalone link-style text.
  `--primary` in dark mode is tuned as a _button fill_ color (paired with near-white
  text, ~18:1 contrast) — used as text directly on the page background it measured
  only ~2.2:1, well under WCAG AA's 4.5:1 minimum for normal text. Switched both to the
  new `text-link` token (~5.2:1 in dark mode). `--primary` itself is untouched, so
  every filled button/badge keeps its existing contrast.
- **Flaky `ThemeProvider` story** (`apps/storybook/src/stories/theme-provider.stories.tsx`):
  the play function asserted the initial render showed `Current theme: light`, but
  `next-themes` seeds its `theme` state from `localStorage.getItem('theme')` on mount,
  which persists across story runs within the same Playwright browser session — since
  this same story calls `setTheme('dark')` on every run, a later run (or different
  story order) could start already in dark mode. Fixed by clicking "Light" first to
  force a known state before asserting, with both assertions wrapped in `waitFor`.

### Changed

- `apps/storybook/vitest.config.ts` coverage config: added
  `../../packages/ui/src/**/*.{ts,tsx}` to `include` and set `allowExternal: true` —
  v8's coverage provider only instruments files inside the project root by default, so
  without `allowExternal` the extra include glob silently matched nothing.

### Results

- `apps/storybook` coverage (v8, includes `@vhnam/ui`): **84.51%** statements /
  **69.73%** branches / **90.9%** functions / **83.68%** lines, up from
  **72.49%** / **59.51%** / **77.47%** / **71.06%** before this branch. 131 tests,
  all passing.
- `packages/utils` coverage: **99.2%** statements / **93.22%** branches / **100%**
  functions / **99.19%** lines. 71 tests, all passing.

### Known gaps (investigated, not fixable from stories/tests alone)

- `.storybook/main.ts` / `manager.ts` (0%): only execute in Storybook's dev-server/
  manager process, never loaded inside the vitest browser-mode test iframe.
- `sidebar.tsx` (2 lines) and the `use-mobile.ts` branch: gated on real
  `window.innerWidth`/`matchMedia`; Storybook's viewport global can't reliably force
  actual Playwright browser viewport width from inside a `play` function.
- `dropdown-menu.tsx` (`DropdownMenuPortal` re-export, 1 line): no story composes it
  directly — all use `DropdownMenuContent`, which invokes the primitive `Portal`
  itself.
- `currency/utils.ts` (`formatCurrency`, `toCurrencyAmount`, etc., partially unused)
  and most of `date/utils.ts` (`formatDateShort/Long`, `formatRelative`,
  `isDateInRange`, `getTodayRange`, …): several exports aren't called by any current
  `@vhnam/ui` component, so their branches show 0% in the _storybook_ coverage report
  specifically — these are now separately covered by the new `packages/utils` unit
  tests instead.
- `currency/input.ts:145` (`formatCurrencyInput`'s `hasTrailingDecimal` branch):
  confirmed genuinely unreachable — `hasTrailingDecimal` can only be true when
  `rawValue` ends with `.`, but in that case `rawValue.split('.')[1]` is always `''`
  (not `undefined`), so the `fractionPart !== undefined` branch above it always fires
  first. Left as-is (dead code, flagged rather than silently removed since it wasn't
  part of the ask).

### Fixed (housekeeping)

- `packages/utils/coverage/**` (the generated HTML/lcov report) had been committed —
  unlike `apps/storybook`, `packages/utils` had no `.gitignore` excluding `coverage`.
  Added `packages/utils/.gitignore` and removed the generated files from git tracking.

### Verification

- `pnpm vp check --fix` — clean (format, lint, types) across 323 files.
- `apps/storybook`: `pnpm test:coverage` — 35 test files, 131 tests passing.
- `packages/utils`: `pnpm test:coverage` — 3 test files, 71 tests passing.

### Commits

- `7ccf0cf` test: update test coverage
