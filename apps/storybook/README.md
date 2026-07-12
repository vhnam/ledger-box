# @vhnam/storybook

Storybook for the `@vhnam/ui` component library.

See the [root README](../../README.md) for monorepo-wide setup.

## Scripts

```bash
pnpm dev     # run Storybook dev server at http://localhost:6006
pnpm build    # build the static Storybook site to storybook-static/
```

## Adding a story

Stories live in `src/stories/<component>.stories.tsx`, one file per component in `packages/ui/src/components`. Follow the existing pattern (`Meta`/`StoryObj`, `centered` layout, `autodocs` tag) — see `src/stories/button.stories.tsx` for the simplest example.

Every component currently in `packages/ui/src/components` has a matching story here. When you add or touch a component in `@vhnam/ui`, add or update its story in the same change.
