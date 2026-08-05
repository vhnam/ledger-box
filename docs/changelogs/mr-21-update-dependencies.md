# MR 21 — Dependency Updates & Icon Component Hardening

**Branch:** `refactor/update-dependencies` → `main`

### Context

Routine dependency refresh across the workspace (`vite-plus`/`vite` core, Storybook,
TanStack, AWS SDK, `better-auth`, etc.), consolidated onto the `pnpm-workspace.yaml`
catalog wherever a package had drifted to a pinned or duplicated version. The
`@phosphor-icons/react` bump changed its exported `Icon` type shape, which broke
`packages/ui`'s `Icon` component and its consumers at the type level — fixed alongside
the bump rather than pinning around it. Also added a database seed script for local
development and swapped the README's screenshot placeholders for real images.

### Changed

- **Dependency catalog** (`pnpm-workspace.yaml`, `package.json`,
  `apps/ledger-box/package.json`, `apps/storybook/package.json`,
  `packages/ui/package.json`): bumped `vite`/`vite-plus` (`@voidzero-dev/vite-plus-core`
  0.2.4 → 0.2.8), Storybook/`@storybook/*` (10.5.5 → 10.5.6), TanStack Router/Query,
  AWS SDK (3.1100 → 3.1102), `@types/*`, `playwright`, `resend`, `shadcn`, `tsx`,
  `typescript` (^6 → ^6.0.3), `@base-ui/react` (^1.6.0 → ^1.7.0), `@fontsource/*`
  (5.2.x → 5.3.0), and `axios` (^1.18 → ^1.19). Moved `@dotenvx/dotenvx`, `better-auth`,
  `vite`, and `@types/pg` onto the shared catalog instead of package-local pins, so all
  three apps/packages stay on one resolved version. Added
  `minimumReleaseAgeExclude` entries for the `vite-plus`/`better-auth` package families
  so their pinned versions aren't held back by pnpm's minimum-release-age check.
- **`Icon` component** (`packages/ui/src/components/icon.tsx`): `@phosphor-icons/react`
  no longer exports a shared `Icon` type to constrain against, so `IconName` is now
  derived directly from `` `${string}Icon` `` keys on the package's namespace import, and
  `IconBaseProps`/`PhosphorIcon` are defined locally instead of imported. Also guards
  against an unresolved icon name (`name && PhosphorIcons[name]`) and renders `null`
  instead of throwing if neither `icon` nor a valid `name` is supplied.
- **`ThemeProvider`** (`packages/ui/src/components/theme-provider.tsx`): `next-themes`'
  updated `ThemeProviderProps` type no longer accepts `children` in a way that satisfies
  React 19's stricter component typing, so the provider is cast through a local
  `ThemeProviderProps` (`Omit<NextThemesProviderProps, 'children'> & { children?:
ReactNode }`) and rendered via a typed `Provider` alias.
- **`Toast`** (`packages/ui/src/components/toast.tsx`): replaced direct
  `@phosphor-icons/react` icon imports (`XIcon`, `CheckCircleIcon`, etc.) with the
  `Icon` component (`<Icon name="XIcon" />`), consistent with the rest of `@vhnam/ui`
  and no longer sensitive to the phosphor-icons export shape.
- `AGENTS.md`: documented the `vp <name>` vs `vp run <name>` distinction (built-in
  command vs. `package.json` script/`vite.config.ts` task) to stop agents from assuming
  `vp dev` and `vp run dev` are interchangeable.
- `deno.lock`: dropped the stale `workspace.packageJson.dependencies` entries
  (`@dotenvx/dotenvx@1.75.1`, `@voidzero-dev/vite-plus-core@0.2.4`) that no longer match
  the bumped root `package.json`.

### Added

- `apps/ledger-box/scripts/seed.ts` (+`db:seed` script): seeds a wallet named
  "Everyday Spending" with 15 English-language sample transactions (salary, rent,
  groceries, subscriptions, etc.) for a given `tenant-id`, computing the wallet's
  running balance from the seeded entries. Usage:
  `pnpm --filter ledger-box db:seed <tenant-id>`.
- `docs/screenshots/wallet-page.png`, `docs/screenshots/shared-statement.png`: real
  screenshots replacing the `README.md` placeholder text (`_[Screenshot: wallet page]_`
  → `![Screenshot: wallet page](docs/screenshots/wallet-page.png)`).

### Verification

- `npx tsc --noEmit` — clean, including the new `Icon`/`ThemeProvider` typings and
  `scripts/seed.ts`.
- `pnpm --filter ledger-box db:seed <tenant-id>` — run against a live dev database,
  seeded successfully.

### Commits

- `161daea` refactor: update dependencies
- `f7603ab` chore: update README.md
