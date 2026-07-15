# Ledger Box

A personal finance tracker built as a Vite+ monorepo.

## Structure

- [`apps/ledger-box`](apps/ledger-box/README.md) — the app (TanStack Router, better-auth, Postgres via Kysely, Netlify Functions)
- [`apps/storybook`](apps/storybook/README.md) — component stories for `@vhnam/ui`
- [`packages/ui`](packages/ui/README.md) — shared UI components (shadcn-style, base-ui + Tailwind)

## Prerequisites

- Node.js >= 24
- pnpm 11.12.0 (pinned via `packageManager`)
- Docker (for local Postgres)

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Start Postgres:

```bash
docker compose up -d
```

3. Copy the env file and fill in the values:

```bash
cp .env.example .env
```

| Variable               | Description                                                   |
| ---------------------- | ------------------------------------------------------------- |
| `DATABASE_URL`         | Postgres connection string (matches `compose.yml` by default) |
| `BETTER_AUTH_SECRET`   | Secret used by better-auth to sign sessions                   |
| `BETTER_AUTH_URL`      | Base URL the app is served on, e.g. `http://localhost:8888`   |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID (for social sign-in)                   |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret                                    |

`.env` must live at the repo root — `netlify dev` loads it from there, not from `apps/ledger-box`.

4. Run database migrations:

```bash
pnpm --filter @vhnam/ledger-box db:migrate
```

## Development

- Check everything is ready (lint, typecheck, format):

```bash
vp run ready
```

- Run the tests:

```bash
vp run -r test
```

- Build the monorepo:

```bash
vp run -r build
```

- Run the app (via Netlify Dev, so `/api/*` functions work):

```bash
pnpm dev
```

- Run Storybook:

```bash
pnpm --filter @vhnam/storybook dev
```

## Database migrations

Migrations live in `apps/ledger-box/src/lib/db/migrations` and run via Kysely's migrator:

```bash
pnpm --filter @vhnam/ledger-box db:migrate       # apply pending migrations
pnpm --filter @vhnam/ledger-box db:migrate:down  # roll back the last migration
pnpm --filter @vhnam/ledger-box db:reset         # truncate wallets/transactions and re-seed demo data
```
