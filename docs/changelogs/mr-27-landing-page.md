# mr-27 — Landing page

## Summary

Adds `apps/landing`, an Astro site for the Ledger Box marketing/landing page, wired
into the pnpm workspace and `vp run -r build`.

## Added

### `apps/landing` (`@vhnam/landing`)

- Astro 7 (Vite 8 / Rolldown) static site with `@astrojs/react` used for a single
  interactive island (mobile nav toggle) — the rest of the page is static markup.
- Design tokens (colour, radius, typography) imported from `@vhnam/ui`'s
  `globals.css`; the app does not import `@vhnam/ui` components.
- Homepage sections built from the root `README.md`'s "The situation it's built
  for," "Features," and "Design decisions" copy: hero, situation, a three-step
  "how it works" flow (you / the recipient / the funder), a features grid, and
  design decisions. No fabricated marketing copy.
- Placeholder block flags where real product screenshots (wallet page, shared
  statement) need to be dropped in — no fabricated images added.
- `dev` / `build` / `preview` scripts are `vp run`-compatible; `build` runs
  `astro check && astro build` and is included in `vp run -r build`.

## Out of scope (v1)

- Real product screenshots (flagged with a `TODO` in `src/pages/index.astro`)
- New migrations or environment variables

## Setup after merge

```bash
vp install
vp run dev   # apps/landing, http://localhost:4321
```

No new migrations, no new environment variables.

## Commits

- `f7b254e` chore: add ui-ux-pro-max agent skill
- `85caebb` feat(landing): scaffold Astro marketing app
- `e8135a2` feat(landing): add base layout and shared design tokens
- `c38bec0` feat(landing): add site nav with mobile menu island
- `f68d4b6` feat(landing): add hero section
- `e1dfd93` feat(landing): add situation and how-it-works sections
- `d7f12e0` feat(landing): add features and design-decisions sections
- `18492d1` feat(landing): assemble homepage with footer and illustration assets
- `c8eb045` docs: add mr-27 landing page changelog
