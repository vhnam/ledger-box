# mr-28 — shadcn `components/ui` layout, typefaces, Vite+ 0.3

## Summary

Moves `@vhnam/ui` shadcn primitives to `src/components/ui`, switches class merging
to the `cn` package, and retargets Ledger Box, landing, and Storybook imports.
Also bumps the workspace catalog and Vite+ to 0.3.0, and replaces the UI typefaces.

## Added

- `@vhnam/ui` `PasswordInput` and `ButtonGroup`; package exports for `lib/cn`,
  `lib/theme`, and `lib/avatar`.
- Pagination next/previous copy keys in all locale catalogs.
- Better Auth agent skills (`better-auth-best-practices`, `create-auth`).

## Changed

- shadcn `ui` alias is `#/components/ui`. Import `@vhnam/ui/components/ui/<name>`
  instead of `@vhnam/ui/components/<name>`. `ThemeProvider` lives at
  `@vhnam/ui/lib/theme`; use `cn` (or `@vhnam/ui/lib/cn`) instead of
  `@vhnam/ui/lib/utils`.
- Type tokens: `font-heading` / `font-sans` → `font-display` / `font-body`
  (Space Grotesk, Geist Mono, JetBrains Mono).
- Catalog: Vite+ `0.2.8` → `0.3.0`, `better-auth` `^1.7.2`, Storybook `^10.6.0`,
  plus related TanStack / shadcn / Astro bumps. Ledger Box resolves `vite` via
  the catalog.

## Removed

- App-local avatar helpers (`apps/ledger-box/src/utils/avatar`); use
  `@vhnam/ui/lib/avatar`.
- `clsx` / `tailwind-merge` and `packages/ui/src/lib/utils.ts`.

## Setup after merge

```bash
vp install
```

No new migrations or environment variables. Consumers of `@vhnam/ui` must update
import paths as above.

## Commits

- `0051508` chore: add better-auth agent skills
- `1fff8fa` chore: bump catalog dependencies and Vite+ to 0.3.0
- `7eb80e2` refactor(ui): move shadcn primitives under components/ui
- `669d2d6` refactor: retarget apps to the new UI paths and font tokens
