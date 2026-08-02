# Development guideline

How to set up Ledger Box locally and the conventions to follow while working on it.

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

| Variable                            | Description                                                                                               |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                      | Postgres connection string (matches `compose.yml` by default)                                             |
| `BETTER_AUTH_SECRET`                | Secret used by better-auth to sign sessions                                                               |
| `BETTER_AUTH_URL`                   | Base URL the app is served on, e.g. `http://localhost:8888` or `http://192.168.1.209:8888` for LAN access |
| `GOOGLE_CLIENT_ID`                  | Google OAuth client ID (for social sign-in)                                                               |
| `GOOGLE_CLIENT_SECRET`              | Google OAuth client secret                                                                                |
| `CLOUDFLARE_ACCOUNT_ID`             | Cloudflare account ID, for R2 object storage (transaction attachments)                                    |
| `CLOUDFLARE_R2_BUCKET_NAME`         | R2 bucket name attachments are uploaded to                                                                |
| `CLOUDFLARE_R2_ACCESS_TOKEN`        | R2 access key ID                                                                                          |
| `CLOUDFLARE_R2_SECRET_ACCESS_TOKEN` | R2 secret access key                                                                                      |
| `CLOUDFLARE_R2_PUBLIC_URL`          | Public base URL the bucket is served from                                                                 |
| `RESEND_API_KEY`                    | Resend API key, used to send wallet-invite emails                                                         |
| `RESEND_EMAIL_FROM_ADDRESS`         | From-address invite emails are sent from                                                                  |

`.env` must live at the repo root — `netlify dev` loads it from there, not from `apps/ledger-box`.

4. Run database migrations:

```bash
pnpm --filter @vhnam/ledger-box db:migrate
```

## Running the app

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

Open `http://localhost:8888` locally, or `http://<your-lan-ip>:8888` from another device on the same network. Set `BETTER_AUTH_URL` in `.env` to the URL you actually use (e.g. `http://192.168.1.209:8888`).

- Run Storybook:

```bash
pnpm --filter @vhnam/storybook dev
```

- Preview the wallet-invite email without sending it (renders to a temp HTML file):

```bash
pnpm --filter @vhnam/ledger-box preview:email
```

## Coding conventions

The full, authoritative list of project conventions lives in [`AGENTS.md`](../../AGENTS.md) at the repo root. The points below are the ones most likely to trip up a change; check `AGENTS.md` for anything not covered here.

**Where new code goes:**

| Path              | Package             | Contains                                                     |
| ----------------- | ------------------- | ------------------------------------------------------------ |
| `apps/ledger-box` | `@vhnam/ledger-box` | The app: routes, business logic, Netlify functions, DB layer |
| `apps/storybook`  | `@vhnam/storybook`  | Stories for every `@vhnam/ui` component                      |
| `packages/ui`     | `@vhnam/ui`         | Shared presentational components (shadcn-derived)            |
| `packages/utils`  | `@vhnam/utils`      | Currency and date formatting helpers                         |

- Reusable, presentational, no business logic → `packages/ui`, plus a Storybook story.
- Currency or date formatting → `packages/utils`. Never re-implement formatting locally.
- Anything that knows about wallets, transactions, or tenancy → `apps/ledger-box`
  (`src/modules/` for feature UI, `src/queries/` for TanStack Query, `*.actions.tsx` for
  handlers — see `wallet-create-dialog` for the pattern).

**Tenancy scoping is non-negotiable.** Every wallet, transaction, and attachment is
scoped by `tenant_id`. Any Netlify handler touching `wallet`, `transaction`, or
`wallet_member` must go through the shared helpers in
`apps/ledger-box/netlify/functions/lib/tenant-access.ts` (`getTenantId`,
`requireOwnedWallet`, `requireOwnedTransaction`, `requireWalletAccess`,
`requireWalletWriteAccess`). Never query `wallet` or `transaction` without a tenant
predicate — a missing check is a data leak between users, not a style issue.

**Money rules:**

- Balance updates are atomic with the transaction write — creating, editing, or deleting
  a transaction must adjust `wallet.balance` in the same operation.
- Editing a transaction reverses the old amount and applies the new one, not just
  overwrites the row.
- Transfers are a linked expense/income pair (`POST /api/wallets/transfer`) — never touch
  one leg without the other.
- Soft delete for `wallet`, `transaction`, and `wallet_member`. Attachments are the
  exception — deleting one removes the object from R2 permanently.
- The activity log (`wallet_activity_log`) is append-only, written in the same Postgres
  transaction as the ledger change via `wallet-mutations.ts`.
- Currency is VND by default. Use `formatCurrency` / `formatShortCurrency` /
  `formatSignedCurrency` from `@vhnam/utils`, and the `CurrencyInput` component for entry.

**Conventions that differ from most other codebases:**

- Imports use `#/` in app and UI source — not `@/`, not long relative paths.
- Toasts use the imperative `toast.add({ title, type })` API — Sonner and `toast.success`
  were removed.
- Forms are Formisch + Valibot, not React Hook Form / Zod. Schemas live in
  `apps/ledger-box/src/schemas/` as `*.schema.ts`.
- The database layer is Kysely (query builder) — no Prisma, no Drizzle, no raw SQL.
- Routing is TanStack Router (file-based); server state is TanStack Query — mutations
  must invalidate the wallet/transaction queries so balances refresh.

## Database migrations

Migrations live in `apps/ledger-box/src/lib/db/migrations`, named `000N_short_description`,
and run via Kysely's migrator:

```bash
pnpm --filter @vhnam/ledger-box db:migrate       # apply pending migrations
pnpm --filter @vhnam/ledger-box db:migrate:down  # roll back the last migration
```

Add new migrations; never edit one that has already been merged.

## Before you commit

Run format, lint, typecheck, and tests:

```bash
vp check && vp test
```

Every merge to `main` gets a file at `docs/changelogs/mr-<NN>-<slug>.md` describing what
it introduced (features, API routes, migrations, breaking changes, new environment
variables, setup steps, commit hashes), plus a matching entry in the root `CHANGELOG.md`.
