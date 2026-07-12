# @vhnam/ledger-box

The Ledger Box app — TanStack Router + React frontend, better-auth for authentication, Postgres via Kysely, served through Netlify Functions.

See the [root README](../../README.md) for monorepo-wide setup (install, Postgres via Docker, `.env`).

## Structure

```
netlify/functions/    Netlify Functions (API routes, served under /api/*)
src/routes/            File-based routes (TanStack Router)
src/layouts/            Route layouts (auth-layout, app-layout)
src/modules/             Feature UI, grouped by domain (auth, wallets, settings)
src/queries/             TanStack Query hooks + API clients, grouped by domain
src/schemas/             Valibot schemas shared by forms and API validation
src/lib/                  auth (better-auth), auth-client, db (Kysely)
```

Feature modules follow a `*.tsx` (presentational) + `*.actions.tsx` (state/handlers) split — see `src/modules/wallets/create-wallet-dialog` for the pattern. Forms are built with [Formisch](https://formisch.dev) validated against the schemas in `src/schemas`.

## API routes

| Route          | Methods   | Description                                        |
| -------------- | --------- | -------------------------------------------------- |
| `/api/auth/*`  | all       | better-auth handler (email/password, Google OAuth) |
| `/api/wallets` | GET, POST | List wallets / create a wallet                     |

All routes except `/api/auth/*` require an authenticated session (checked via `auth.api.getSession`).

## Scripts

```bash
pnpm dev              # run via Netlify Dev (so /api/* functions work)
pnpm build             # typecheck + build
pnpm preview            # preview the production build
pnpm db:migrate          # apply pending Kysely migrations
pnpm db:migrate:down      # roll back the last migration
```

## Auth

Email/password and Google OAuth are handled by [better-auth](https://www.better-auth.com/). Configure Google OAuth credentials in `.env` (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`) and register the redirect URI in Google Cloud Console:

```
{BETTER_AUTH_URL}/api/auth/callback/google
```

Routes under `/_app` (the authenticated app shell) redirect to `/auth/login` when there's no session — see `src/routes/_app/route.tsx`.
