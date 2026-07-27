# MR 07 — Hash Import Alias

**Branch:** `refactor/import` → `main`

### Added

#### Storybook

- `attachment.stories.tsx` — Attachment compound component (states, sizes, groups, upload flow)
- `badge.stories.tsx` — all Badge variants (`default`, `secondary`, `destructive`, `outline`, `ghost`, `link`)
- `currency-input.stories.tsx` — default and field-wrapped CurrencyInput demos

#### Import alias (`#/`)

- `#/` path alias in `@vhnam/ledger-box` (`tsconfig` paths + `package.json` `imports`)
- `#/` path alias in `@vhnam/ui` (replaces `@/`)
- `@vhnam/ui/vite` plugin resolves `#/` for both UI package source and a consuming app's `src` (via `ui(appSrc)`)

### Changed

#### UI (`@vhnam/ui`)

- All internal component imports converted from relative / `@/` to `#/`
- `components.json` shadcn aliases updated to `#/`
- `shadcn-relative-imports.mjs` rewrites `@/` → `#/` after `shadcn:add` (no longer converts to relative paths)
- `package.json` — added `imports: { "#/*": "./src/*" }`
- `tsconfig.json` — paths `@/*` → `#/*`
- `vite.ts` — `ui()` accepts optional `appSrc` and resolves `#/` imports for UI and consumer apps
- README — documents `ui(src)` Vite setup and updated shadcn import workflow

#### Ledger Box (`@vhnam/ledger-box`)

- All `src/` imports converted to `#/` alias (modules, layouts, queries, routes)
- Netlify functions and scripts — `../../src/...` imports → `#/...`
- `vite.config.ts` — uses `ui(src)` plugin; removed manual `resolve.alias` for `#`
- `tsconfig.json` — `include` extended to `netlify` and `scripts`; `#/*` paths fall back to `../../packages/ui/src/*` so `tsc` can typecheck `@vhnam/ui` source
- `package.json` — added `imports: { "#/*": "./src/*" }`
- `wallet-pagination.tsx` — `size="sm"` on pagination controls (TypeScript fix)

#### Storybook

- `tsconfig.json` — paths `@/*` → `#/*`

### Removed

- Manual Vite `resolve.alias` for `#` in ledger-box (handled by `@vhnam/ui/vite`)
- Relative-path conversion in the shadcn post-install script (replaced by `#/` aliases)

### Setup after merge

```bash
vp install
```

No database migrations required.

### Commits

- `7d9daa2` refactor(ui): refactor import with alias
- `b5bdf4c` feat(storybook): add missing Stories
- `6d1783e` refactor(ledger-box): refactor import with alias
- `54fb931` fix(ledger-box): able to build with import alias
