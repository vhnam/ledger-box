# MR 01 — Auth & Google OAuth

**Branch:** `feat/auth` → `main`

### Added

#### Authentication

- Email/password login and registration via [Better Auth](https://www.better-auth.com/)
- Google OAuth sign-in
- Auth Netlify function at `/api/auth/*`
- Protected app routes under `/_app` with session redirect to `/auth/login`
- Auth layout and login/register pages

#### Wallets

- Wallet CRUD API via Netlify function at `/api/wallets`
- React Query hooks for listing and creating wallets
- Create wallet dialog with form validation (Formisch + Valibot)
- Wallets page with loading, error, and empty states
- Wallet list in the app sidebar

#### Database

- PostgreSQL service in `compose.yml`
- Kysely setup with `wallet` and `transaction` tables
- File-based migrations via `pnpm db:migrate` / `pnpm db:migrate:down`
- Initial migration: `0001_create_wallet_and_transaction`

#### App shell

- App layout with collapsible sidebar
- Sidebar sections for wallets, new-wallet action, and user account menu
- Root redirect from `/` to `/wallets`

#### UI package (`@vhnam/ui`)

- New components: Avatar, Card, Dialog, Dropdown Menu, Field, Icon, Input, Label, Separator, Sheet, Sidebar, Skeleton, Sonner, Spinner, Textarea, Tooltip
- `use-mobile` hook for responsive sidebar behavior
- Shadcn add scripts with relative import post-processing

#### Storybook (`@vhnam/storybook`)

- New Storybook app with stories for UI components
- Tailwind and UI package Vite plugin integration

#### Tooling

- OXC formatter config (`.oxfmtrc.json`)
- Root `.env.example` with required environment variables

### Changed

- Replaced the starter landing page with routed auth and app experiences
- Updated global and app styles to use the expanded design system
- Extended `pnpm-workspace.yaml` catalog with new dependencies
- Removed unused starter assets (`hero.png`, `typescript.svg`, `vite.svg`)
- Replaced `hello` Netlify function with `auth` and `wallets` functions

### Removed

- `apps/ledger-box/netlify/functions/hello.mts`
- Root `/src` directory (empty, unused)

### Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable               | Description                                   |
| ---------------------- | --------------------------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string                  |
| `BETTER_AUTH_SECRET`   | Secret for signing auth tokens                |
| `BETTER_AUTH_URL`      | Public app URL (e.g. `http://localhost:8888`) |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID                        |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret                    |

### Setup after merge

```bash
vp install
docker compose up -d
pnpm --filter @vhnam/ledger-box db:migrate
vp run dev
```

### Commits

- `3968478` feat(storybook): initial Storybook
- `bb3bf39` feat: format code with OXC
- `4995a32` feat(ui): add components
- `764840d` feat(ui): add Sidebar
- `30a6755` feat(auth): can login/register
