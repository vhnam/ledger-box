<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

---

# Ledger Box

A wallet / ledger application for tracking money — including money held on behalf of
other people. The product question it exists to answer is **"how much is in this wallet,
and can I account for it?"**, not "what did I spend it on".

Two consequences that shape most decisions in this repo:

- **Balances must be provable.** Anything that can silently make a balance wrong is a
  serious bug, even if nothing throws.
- **There are no spending categories, and this is deliberate.** Do not add a category or
  tag field to transactions. Description is free text and carries that information.

---

## Repository layout

| Path              | Package             | Contains                                                     |
| ----------------- | ------------------- | ------------------------------------------------------------ |
| `apps/ledger-box` | `@vhnam/ledger-box` | The app: routes, business logic, Netlify functions, DB layer |
| `apps/storybook`  | `@vhnam/storybook`  | Stories for every `@vhnam/ui` component                      |
| `packages/ui`     | `@vhnam/ui`         | Shared presentational components (shadcn-derived)            |
| `packages/utils`  | `@vhnam/utils`      | Currency and date formatting helpers                         |

**Where new code goes:**

- Reusable, presentational, no business logic → `packages/ui`, **plus a Storybook story** (and a `play` function when the component is interactive).
- Currency or date formatting → `packages/utils`. Never re-implement formatting locally.
- Anything that knows about wallets, transactions, or tenancy → `apps/ledger-box`
  (`src/modules/` for feature UI, `src/queries/` for TanStack Query, `*.actions.tsx`
  for handlers — see `create-wallet-dialog` for the pattern).

---

## Non-negotiable: tenancy scoping

Every wallet, transaction, and attachment is owned by a `tenant_id`. In the current model
(v1) this equals the better-auth user id — **one user is one tenant**.

**Every Netlify handler that touches `wallet`, `transaction`, or `wallet_member` must
scope by tenant.** Use the shared helpers in
`apps/ledger-box/netlify/functions/lib/tenant-access.ts`:

- `getTenantId` — resolve the tenant from the session
- `requireOwnedWallet` — assert the wallet belongs to the tenant
- `requireOwnedTransaction` — assert the transaction belongs to the tenant

Never query `wallet` or `transaction` without a tenant predicate, and never trust a
`walletId` from the URL without an ownership check first. A missing check is a data leak
between users, not a style issue.

R2 object keys are tenant-scoped too: `tenants/{tenantId}/transactions/{transactionId}/...`.
Read paths still resolve legacy keys under `transactions/{transactionId}/...` — keep that
fallback.

Member read/write access is real: `requireWalletAccess` and `findAccessibleWallets` in
`tenant-access.ts` resolve an effective `owner` / `manager` / `viewer` role from
`wallet_member` (auto-activating a matching pending invite), so an invited member does
see the wallet once they sign in. `requireWalletWriteAccess` additionally rejects
`viewer` for write operations. Wallet settings specifically are gated to non-viewer
roles at the route (`WalletSettingsPage` redirects a viewer to the wallet page); the
per-endpoint helpers (`requireOwnedWallet`, `requireWalletWriteAccess`) remain the
server-side authorization boundary regardless of what the client renders.

---

## Money rules

- **Balance updates are atomic with the transaction write.** Creating, editing, or
  deleting a transaction must adjust `wallet.balance` in the same operation. Never write
  one without the other.
- **Editing a transaction must reverse the old amount and apply the new one**, not just
  overwrite the row.
- **Transfers are a linked pair** of expense + income across two wallets
  (`POST /api/wallets/transfer`). Touching one leg without the other corrupts both
  balances.
- **Soft delete** for `wallet`, `transaction`, and `wallet_member`. Never hard-delete
  these. Deleting a transaction must also reverse its balance effect.
- **Attachments are the exception** — deleting one removes the object from R2 permanently.
- **Activity log is append-only.** `wallet_activity_log` entries are never edited and
  never soft-deleted. Money-affecting writes go through
  `netlify/functions/lib/wallet-mutations.ts`, which records activity in the **same**
  Postgres transaction as the ledger change. Other in-scope mutators (wallet rename/
  delete, members, statement shares) call `recordActivity` in the same transaction.
  Attachment upload/delete is not logged in v1. `GET /api/wallets/:walletId/activity`
  is **owner-only** (`requireOwnedWallet`).
- Currency is VND by default. Use `formatCurrency`, `formatShortCurrency`,
  `formatSignedCurrency` from `@vhnam/utils`, and the `CurrencyInput` component for entry.

---

## Conventions that are easy to get wrong

These differ from the defaults you have most likely seen elsewhere. Check each one before
writing code.

**Imports use `#/` in app and UI source — not `@/` or long relative paths.**

```ts
import { Button } from "#/components/button"; // correct
import { Button } from "@/components/button"; // wrong
import { Button } from "../../components/button"; // wrong
```

Both `@vhnam/ui` and `@vhnam/ledger-box` declare `imports: { "#/*": "./src/*" }`. The
`@vhnam/ui/vite` plugin resolves `#/` for the UI package and, via `ui(appSrc)`, for the
consuming app. After running `shadcn:add`, the post-install script rewrites `@/` → `#/`.

Netlify functions import app code via `#/lib/...` but may use `./lib/...` for co-located
helpers under `apps/ledger-box/netlify/functions/`.

**Toasts use the imperative `toast.add` API.** Sonner was removed.

```ts
toast.add({ title: "Saved", type: "success" }); // correct
toast.success("Saved"); // wrong — this API no longer exists
```

Variants: `success`, `info`, `warning`, `error`, `loading`.

**Forms are Formisch + Valibot.** Not React Hook Form, not Zod. Valibot schemas live in
`apps/ledger-box/src/schemas/` as `*.schema.ts`.

**UI strings use `react-intl`.** Message catalogs live in
`packages/utils/src/i18n/messages/{en,vi,fr,ja}.json` (language codes; `en-US`/`en-GB`
share `en`). Prefer `<FormattedMessage id="…" defaultMessage="…" />` in JSX and
`useIntl().formatMessage` for toasts, placeholders, and other imperative copy. Valibot
schemas store **message ids** (e.g. `validation.amount.required`) — render them with
`formatErrorMessage` from `#/lib/intl-message` (known ids translate; unknown strings
pass through). Do not put `react-intl` inside `@vhnam/ui`; pass translated props from the
app. Keep the brand name "Ledger Box" untranslated.

**API errors are coded JSON.** Netlify app handlers return
`{ code, message }` via `apiError` / `ApiErrors` in
`netlify/functions/lib/api-error-response.ts` (codes in `#/lib/api-error-codes.ts`). The
English `message` is for logs/fallback; the client maps `code` → catalog id
`errors.{CODE}` through `getApiError` / `getApiErrorMessage`, then `formatErrorMessage`.
Do not introduce new plain-text `Response('…')` error bodies for app handlers (CSV
success and better-auth excepted).

**The database layer is Kysely.** Query builder, not an ORM. No Prisma, no Drizzle, no
raw string SQL.

**Routing is TanStack Router, file-based.** Server state is TanStack Query — mutations
must invalidate the wallet and transaction queries so balances refresh.

---

## Database migrations

File-based, named `000N_short_description`. Current set:

- `0001_create_wallet_and_transaction`
- `0002_add_wallet_tenant_id`
- `0003_create_wallet_member`
- `0004_add_transaction_occurred_at_and_wallet_timezone`
- `0005_create_wallet_statement_share`
- `0006_add_wallet_member_user_lookup_index`
- `0007_create_wallet_activity_log`
- `0008_add_wallet_member_invite_token`
- `0009_add_wallet_currency`
- `0010_create_user_settings`

Add new migrations; **never edit one that has been merged**. Migrations run forward with
`pnpm --filter @vhnam/ledger-box db:migrate` and back with `db:migrate:down`. There is no
seed script — it was removed. For local data, use `apps/ledger-box/scripts/import-csv.ts`
or `apps/ledger-box/scripts/import-bank-csv.ts`.

---

## API

Netlify Functions under `/api/*`, in `apps/ledger-box/netlify/functions`.

| Route                                                                      | Purpose                                                   |
| -------------------------------------------------------------------------- | --------------------------------------------------------- |
| `/api/auth/*`                                                              | better-auth handler                                       |
| `GET` `POST` `/api/wallets`                                                | List, create                                              |
| `PATCH` `DELETE` `/api/wallets/:walletId`                                  | Rename, soft-delete                                       |
| `POST` `/api/wallets/transfer`                                             | Paired expense/income transfer                            |
| `GET` `POST` `/api/wallets/:walletId/transactions`                         | Paginated list, create                                    |
| `PATCH` `DELETE` `/api/wallets/:walletId/transactions/:transactionId`      | Edit, soft-delete                                         |
| `GET` `POST` `.../transactions/:transactionId/attachments`                 | List, upload                                              |
| `DELETE` `.../transactions/:transactionId/attachments/:attachmentId`       | Permanent R2 delete                                       |
| `GET` `POST` `PATCH` `DELETE` `/api/wallets/:walletId/members[/:memberId]` | Invite, update role, remove                               |
| `POST` `/api/wallets/:walletId/members/:memberId/resend`                   | Resend a pending invite email (rate limited per owner)    |
| `GET` `/api/wallets/invites/:token`                                        | Public invite-token verification (no auth)                |
| `GET` `/api/users/by-email`                                                | Look up a better-auth user                                |
| `GET` `/api/wallets/:walletId/summary`                                     | Full-period income/expense/net balance aggregate          |
| `GET` `POST` `/api/wallets/:walletId/statement-shares`                     | List, create/preview a statement share link               |
| `DELETE` `/api/wallets/:walletId/statement-shares/:shareId`                | Revoke a share link                                       |
| `GET` `/api/wallets/:walletId/activity`                                    | Owner-only paginated wallet activity log                  |
| `GET` `/api/public/statements/:token`                                      | Public, unauthenticated statement snapshot (rate limited) |
| `GET` `PATCH` `/api/users/locale`                                          | Read/update the signed-in user's locale preference        |

Attachment uploads accept PDF, PNG, JPG, JPEG, WEBP up to 10 MB. Images are resized
client-side (2048px max, JPEG compression) before upload.

---

## Workflow

Prerequisites: Node.js >= 24, pnpm 11.12.0, Docker (for Postgres).

```bash
vp install                                    # after pulling; installs workspace deps
cp .env.example .env                          # fill in values; .env lives at repo root
docker compose up -d                          # Postgres
pnpm --filter @vhnam/ledger-box db:migrate    # first run and after new migrations
vp run dev                                    # Netlify dev — http://localhost:8888
vp check && vp test                           # format, lint, typecheck, test — before every commit
```

Run `vp check` and `vp test` before proposing a change as done.

---

## Changelog

Every merge to `main` gets a file at `docs/changelogs/mr-<NN>-<slug>.md`, where `NN` is the
merge request number. It records what that merge introduced: features, API routes,
migrations, breaking changes, new environment variables, setup steps, and commit hashes.

The root `CHANGELOG.md` is the condensed, delta-only view — one entry per merge under a
single `## [Unreleased]` heading, newest first. Nothing has been released yet, so do not
introduce version numbers.

When completing a feature, write the per-merge file and add the matching entry to
`CHANGELOG.md`.

---

## Environment variables

See `.env.example`. Required: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and the Cloudflare R2 set
(`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_R2_BUCKET_NAME`, `CLOUDFLARE_R2_ACCESS_TOKEN`,
`CLOUDFLARE_R2_SECRET_ACCESS_TOKEN`, `CLOUDFLARE_R2_PUBLIC_URL`).

`RESEND_API_KEY` and `RESEND_EMAIL_FROM_ADDRESS` power outbound wallet-invite emails
(`netlify/functions/lib/mailer.ts`). Both are optional in local dev — without them, invite
creation and resend still persist normally, `emailSent: false` is returned in the response,
and an `invite_email_failed` activity entry is recorded.

Never commit real values. When adding a variable, add it to `.env.example` in the same
change.
