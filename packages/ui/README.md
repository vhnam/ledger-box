# @vhnam/ui

Shared UI components for the monorepo — [shadcn](https://ui.shadcn.com)-style components built on [Base UI](https://base-ui.com), Tailwind CSS v4, and [Remix Icon](https://remixicon.com).

See the [root README](../../README.md) for monorepo-wide setup. Stories for every component live in [`apps/storybook`](../../apps/storybook).

## Usage

Import components, hooks, and lib utilities by subpath — there's no single barrel export:

```tsx
import { Button } from "@vhnam/ui/components/button";
import { useIsMobile } from "@vhnam/ui/hooks/use-mobile";
import { cn } from "@vhnam/ui/lib/utils";
```

Global styles (Tailwind layers + design tokens) and the Tailwind entrypoint:

```ts
import "@vhnam/ui/globals.css";
```

The package also exports a `vite` preset (`@vhnam/ui/vite`) for consuming apps' `vite.config.ts`.

## Icons

Use the `Icon` wrapper (`@vhnam/ui/components/icon`) around any `@remixicon/react` icon instead of rendering icon components directly — it standardizes sizing/className via `cn`:

```tsx
import { RiUser3Line } from "@remixicon/react";
import { Icon } from "@vhnam/ui/components/icon";

<Icon icon={RiUser3Line} className="text-muted-foreground" />;
```

Import icons by name for tree-shaking (`import { RiUser3Line } from '@remixicon/react'`) — never `import * as Icons`.

## Adding a component

This package tracks [shadcn](https://ui.shadcn.com)'s registry (see `components.json` — style `base-nova`, icon library `remixicon`). To add a new component:

```bash
pnpm --filter @vhnam/ui shadcn:add <component>
```

This runs the shadcn CLI and then rewrites its `@/`-aliased imports to the relative imports this package actually uses.

After adding a component, add a matching story in `apps/storybook/src/stories/<component>.stories.tsx`.

## Structure

```
src/components/   UI components (one file per component)
src/hooks/         Shared hooks (use-mobile, use-theme)
src/lib/            Utilities (cn, etc.)
src/styles/          globals.css, tailwind.css
```
