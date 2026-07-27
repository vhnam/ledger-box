# @vhnam/storybook

Storybook for the `@vhnam/ui` component library.

See the [root README](../../README.md) for monorepo-wide setup.

## Scripts

```bash
pnpm dev          # run Storybook dev server at http://localhost:6006
pnpm build         # build the static Storybook site to storybook-static/
pnpm test          # run story smoke + play + a11y tests (headless Chromium)
pnpm test:watch    # same suite in watch mode
```

From the repo root, `vp test` also picks up this package via the root Vitest projects config.

## Tests

Stories are the UI test surface — `@storybook/addon-vitest` turns every story into a render smoke test. Accessibility runs in `error` mode via `@storybook/addon-a11y`.

- **Static components** (badge, separator, skeleton, …): a story is enough; smoke coverage is automatic.
- **Interactive components**: add a `play` function that uses `expect` / `userEvent` / `within` / `waitFor` from `storybook/test`. See `src/stories/button.stories.tsx` for the simplest pattern; portal overlays (dialog, sheet, select, toast) should query `document.body`.

First-time browser setup (if Chromium is missing):

```bash
pnpm exec playwright install chromium
```

## Adding a story

Stories live in `src/stories/<component>.stories.tsx`, one file per component in `packages/ui/src/components`. Follow the existing pattern (`Meta`/`StoryObj`, `centered` layout, `autodocs` tag) — see `src/stories/button.stories.tsx` for the simplest example.

Every component currently in `packages/ui/src/components` has a matching story here. When you add or touch a component in `@vhnam/ui`, add or update its story (and a `play` function when behavior is non-trivial) in the same change.
