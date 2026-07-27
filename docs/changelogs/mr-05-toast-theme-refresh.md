# MR 05 — Toast API & Theme Refresh

**Branch:** `refactor/ui` → `main`

### Added

#### Toast (Base UI)

- New `@vhnam/ui` toast component (`packages/ui/src/components/toast.tsx`) built on `@base-ui/react/toast`
- Imperative `toast` manager via `ToastPrimitive.createToastManager()` with `toast.add({ title, description?, type? })`
- Variants: `success`, `info`, `warning`, `error`, `loading` (Phosphor icons)
- Stacked viewport toaster (`Toaster`) with swipe-to-dismiss and expand-on-hover behavior
- Storybook stories (`apps/storybook/src/stories/toast.stories.tsx`) covering default, variants, description, and loading

### Changed

#### Notifications

- App root mounts `Toaster` from `@vhnam/ui/components/toast` instead of Sonner
- All toast call sites use `toast.add({ title, type, description? })` instead of `toast.success` / `toast.error`:
  - Logout (`app-sidebar-user`)
  - Account settings save (`settings-account.actions`)
  - Add / edit / delete transaction dialogs
  - Transfer money dialog
  - Attachment upload and delete flows

#### Theme tokens

- Regenerated light and dark CSS variables in `packages/ui/src/styles/globals.css` (Shadcn base-nova refresh)
- Updated primary, secondary, muted, accent, chart, sidebar, and destructive tokens
- Default radius `0.45rem` → `0.625rem`

#### Dependencies

- Root `vite` resolved via `npm:@voidzero-dev/vite-plus-core@0.2.4` (aligned with catalog)
- Catalog bumps: `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` `^3.1090.0` → `^3.1094.0`
- `@vhnam/ui` README component list: `sonner` → `toast`

### Removed

- Sonner toast wrapper (`packages/ui/src/components/sonner.tsx`)
- Sonner Storybook stories (`apps/storybook/src/stories/sonner.stories.tsx`)
- `sonner` dependency from `@vhnam/ui` and the workspace catalog

### Setup after merge

```bash
vp install
```

No database migrations. Toast API is a breaking change for any remaining `toast.success` / `toast.error` callers — use `toast.add({ title, type: 'success' | 'error', ... })`.

### Commits

- `40f2a07` refactor(ui): update Shadcn
