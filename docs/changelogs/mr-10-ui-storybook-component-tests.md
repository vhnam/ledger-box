# MR 10 — UI Component Tests via Storybook

**Branch:** `feat/ui-testing` → `main`

### Added

#### Storybook Vitest test harness

- `@storybook/addon-vitest`, `@vitest/browser-playwright`, and `playwright` catalog-pinned and installed in `@vhnam/storybook`
- `apps/storybook/vitest.config.ts` — Vitest browser project (`storybook`) with Playwright Chromium, `@vhnam/ui/vite` + Tailwind + React plugins, and `storybookTest` story discovery
- `apps/storybook/.storybook/vitest.setup.ts` — Storybook Vitest addon setup
- Root `vite.config.ts` `test.projects` points at the Storybook Vitest config so `vp test` runs story tests
- Package scripts: `pnpm test` / `pnpm test:watch` in `@vhnam/storybook`

#### Interaction tests (`play` functions)

- Play coverage for interactive components: `button`, `currency-input`, `toast`, `dialog`, `sheet`, `select`, `date-picker`, `date-picker-range`, `attachment`, `theme-provider`, `sidebar`
- Smoke coverage for all 33 story-backed `@vhnam/ui` components via `@storybook/addon-vitest`
- Local avatar data URI fixture (`apps/storybook/src/fixtures/sample-avatar.ts`) so attachment/avatar stories do not hit external URLs in CI

#### Documentation

- `apps/storybook/README.md` — Tests section (smoke vs play, `vp test`, Playwright Chromium setup)
- `packages/ui/README.md` — adding a component requires story + play for interactive components
- SPDD analysis and implementation prompt for UI Storybook tests

### Changed

#### Accessibility gate

- `@storybook/addon-a11y` `parameters.a11y.test` promoted from `'todo'` to `'error'`
- Global preview wraps stories in `ThemeProvider` (`defaultTheme="light"`, `enableSystem={false}`) with desktop viewport for stable tests
- Contrast / label fixes in `@vhnam/ui`: destructive button/badge text, muted-foreground token, avatar fallback text, attachment error description, date-picker / select `aria-label`s
- Story-level a11y fixes: input/textarea labels, toggle icon label, badge custom colors; toast `WithPromise` excluded from Vitest (2s delay)

#### Workflow

- `AGENTS.md` Review Checklist — UI changes need a Storybook story; interactive components need a `play` function

### Setup after merge

```bash
vp install
pnpm exec playwright install chromium   # first-time / CI browser binary
vp test                                 # story smoke + play + a11y
```

No database migrations or new environment variables.

### Commits

- `3942d04` test(storybook): add Vitest play coverage for UI components
