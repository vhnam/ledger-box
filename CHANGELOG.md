# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### [mr-19 — unify mobile overlay presentation behind ResponsiveDialog](docs/changelogs/mr-19-unify-mobile-overlay-with-responsive-dialog.md)

#### Added

- `ResponsiveDialog` in `@vhnam/ui` — renders `Sheet` (bottom) below the mobile
  breakpoint and `Dialog` above it behind one prop shape, with `preventDismiss` /
  `onDismissAttempt` to block incidental dismissal (backdrop, Escape, focus-out) for
  dirty forms while the close button still works.

#### Changed

- Add transaction, transfer money, create wallet, and the statement-share dialog now
  render as bottom sheets on mobile (previously dialog-only, inconsistent with edit
  transaction and the delete confirmations). Edit transaction, transaction detail,
  transaction attachments, and the three delete confirmations now share
  `ResponsiveDialog` instead of a duplicated `useIsMobile` branch. Desktop appearance,
  form logic, validation, and mutations are unchanged. The transaction attachment
  full-screen preview and the account-level settings dialog were deliberately left as
  plain dialogs (see the per-merge changelog for why).
- On mobile, the wallet settings sub-header replaces the horizontally scrollable
  General/Activity/Members/Statement shares tab strip with a single dropdown trigger
  showing the active section, next to a plain "Transactions" link. Desktop's sidebar is
  unchanged.

### [mr-18 — extract email templates into typed, component-authored modules](docs/changelogs/mr-18-extract-email-templates.md)

#### Changed

- Wallet invite email moved from `netlify/functions/lib/wallet-invite-email.ts` to `netlify/functions/lib/email-templates/wallet-invite-email.tsx`, converted from a string-building function (`buildInviteEmail`) to a React component (`WalletInviteEmailBody`, wrapped in a shared `EmailLayout` component), rendered server-side with `renderToStaticMarkup`. `react-email`/`@react-email/components` were evaluated and rejected (deprecated component packages; the unified `react-email` package bundles a full CLI/dev-server as runtime dependencies; Storybook preview doesn't fit this repo's `packages/ui`/Tailwind layering). No new dependency was added to the catalog. `html` output gains a table-based, inline-styled wrapper; `subject`/`text` are byte-identical to before.

#### Added

- `preview:email` script (`apps/ledger-box/scripts/preview-email.tsx`) to render the invite template's real component tree and inspect its HTML/text without sending mail.

### [mr-17 — wallet settings access, routing & pagination](docs/changelogs/mr-17-wallet-settings-access-routing-and-pagination.md)

#### Fixed

- Viewer sessions can no longer reach `/wallets/$walletId/settings` (route redirects to the wallet page) or see the settings gear icon; owner/manager access and viewer's transaction/summary/attachment access are unchanged. All settings-backing API endpoints were already owner/role-scoped server-side — no data was exposed to viewers.

#### Changed

- Wallet transactions and settings now share one persistent shell: a left nav with Wallet (Transactions) and Settings (General/Activity/Members/Statement shares) groups on desktop, a horizontal scrollable tab strip on mobile, with settings split into deep-linkable routes. Activity's owner-only rule and the settings-wide viewer exclusion are route guards instead of conditional renders.
- `GET /api/wallets/:walletId/members` and `GET /api/wallets/:walletId/statement-shares` now paginate (`page`/`pageSize` params, `{ items, total, page, pageSize }` response), matching Activity's existing contract. A shared `AppPagination` component and `getPageItems` utility are now used by Transactions, Members, Statement Shares, and Activity alike.
- Danger Zone (delete wallet) is no longer its own settings route — it's now a second, GitHub-styled section on the General page; the `/settings/danger-zone` route and its module were deleted, and Settings nav is four sections instead of five.
- `AGENTS.md` — corrected the stale tenancy-scoping note; member read access has been implemented since MR 11.

### [mr-16 — feat/statement-csv-export](docs/changelogs/mr-16-statement-csv-export.md)

#### Added

- `#/lib/statement-export.ts` — CSV encoding of a statement snapshot (header-block balances, UTF-8 BOM, formula-injection escaping, wallet-timezone dates)
- `?format=csv` on `GET /api/public/statements/:token` (frozen snapshot) and `POST /api/wallets/:walletId/statement-shares?preview=true` (fresh snapshot, not persisted)
- `GET /api/wallets/:walletId/statement-shares/:shareId/export` — owner-only CSV download of an existing share's frozen snapshot
- Download actions on wallet-settings share rows, the create/preview dialog, and the public statement page

### [mr-15 — feat/member-invitation-emails](docs/changelogs/mr-15-member-invitation-emails.md)

#### Added

- Wallet invite emails via Resend (`mailer` + `wallet-invite-email`); create/resend return `emailSent` and log `invite_email_failed` when mail is skipped or fails
- Migration `0008_add_wallet_member_invite_token` (hashed token, expiry, send count, per-wallet invite rate window); activity actions `invite_resend` / `invite_email_failed`
- `POST /api/wallets/:walletId/members/:memberId/resend` and public `GET /api/wallets/invites/:token`; invite page at `/invite/$token`
- Members UI resend action; app + Storybook Ledger Box logo/favicon branding
- Storybook `^10.5.5` viewport globals migration

#### Changed

- Invite persistence is independent of email delivery (optional `RESEND_API_KEY` / `RESEND_EMAIL_FROM_ADDRESS` in local dev)

### [mr-14 — docs/documentation](docs/changelogs/mr-14-getting-started-tutorial.md)

#### Added

- End-user tutorial at `docs/tutorials/getting-started-with-ledger-box.md` (sign-in through activity log)
- Diátaxis documentation-writer agent skill (`.agents/skills/documentation-writer`, `skills-lock.json`)
- `@dotenvx/dotenvx` with `pnpm dev` (`.env.dev`) and `pnpm dev:prod` (`.env.prod`); `RESEND_API_KEY` in `.env.example`
- `.gitignore` entries for `.env.dev` and `.env.prod` (local overlays only; never commit secrets)

#### Changed

- Root pnpm pin `11.12.0` → `11.18.0`; Node engine `>=24` → `>=26`; catalog AWS SDK bumps

### [mr-13 — feat/activity-log](docs/changelogs/mr-13-wallet-activity-log.md)

#### Added

- Append-only wallet activity log (`0007_create_wallet_activity_log`) with same-transaction recording for money mutations, wallet rename/delete, members, and statement-share create/revoke
- Owner-only `GET /api/wallets/:walletId/activity` (paginated; statement-divergence flag at read time) and wallet settings **Activity** feed
- Wallet list `role` on `GET /api/wallets` for owner-gated UI
- Activity-log Vitest coverage and SPDD analysis/prompt docs

#### Changed

- Money handlers route ledger writes through shared `wallet-mutations` helpers that always log; transaction access selects include `description` / `occurredAt` for before-snapshots

### [mr-12 — feat/audit-wallet](docs/changelogs/mr-12-wallet-balance-concurrency-fix.md)

#### Fixed

- Wallet balance lost-update race: `wallet-transactions.mts` (POST), `wallet-transaction.mts` (PATCH/DELETE), and `wallet-transfer.mts` (both legs) now write `wallet.amount` via a SQL-relative expression instead of a JS-computed absolute value, closing a concurrency gap opened by MR-11's manager write access

#### Added

- Concurrency regression tests for wallet balance updates (`wallet-transactions.test.ts`)

### [mr-11 — feat/ui-testing](docs/changelogs/mr-11-wallet-member-access.md)

#### Added

- Role-scoped wallet member access: `viewer` (read-only) / `manager` (full access except delete-wallet and member/statement-share management), resolved via new `tenant-access.ts` helpers alongside the existing owner-only ones
- Pending `wallet_member` invites auto-activate on first matching sign-in (by user id, or by email with backfill for users who register after being invited)
- Migration `0006_add_wallet_member_user_lookup_index`
- Vitest project for `apps/ledger-box` (previously untested), with integration coverage for the new access paths

#### Changed

- `wallets`, `wallet`, `wallet-transactions(s)`, `wallet-transfer`, `wallet-transaction-attachment(s)`, `wallet-summary` handlers resolve access via role-aware helpers instead of owner-only checks
- Wallet-balance update predicates and attachment R2 key scoping fixed to work correctly for non-owner (manager) writers

### [mr-10 — feat/ui-testing](docs/changelogs/mr-10-ui-storybook-component-tests.md)

#### Added

- Storybook Vitest harness (`@storybook/addon-vitest` + Playwright Chromium) wired into `vp test` via root `test.projects`
- Interaction `play` tests for button, currency-input, toast, dialog, sheet, select, date-picker(s), attachment, theme-provider, sidebar; smoke coverage for all 33 UI stories
- Local avatar fixture for network-free story/tests; Storybook / UI README and `AGENTS.md` test workflow notes

#### Changed

- A11y gate: `parameters.a11y.test` `'todo'` → `'error'`; global light ThemeProvider + desktop viewport in Storybook preview
- Contrast and label fixes in `@vhnam/ui` (destructive variants, muted-foreground, avatar, date-picker/select aria-labels)

### [mr-09 — feat/share-link](docs/changelogs/mr-09-shareable-statement-links.md)

#### Added

- Migration `0005_create_wallet_statement_share` — snapshot storage, hashed token, expiry/revocation, access and rate-limit tracking
- Statement share APIs: list/create/preview and revoke at `/api/wallets/:walletId/statement-shares`; public read at `GET /api/public/statements/:token`
- Wallet settings **Statement links** — mandatory preview before create, copy link, revoke; default 90-day expiry
- Public route `/statement/$token` with read-only snapshot view (opening/closing balance, running balance, period + timezone label)
- `#/lib/share-token.ts` (CSPRNG + SHA-256); `#/lib/api-error.ts` shared axios error helper
- `Referrer-Policy: no-referrer` for `/statement/*`

#### Changed

- `AGENTS.md` documents statement-share and public statement routes

### [mr-08 — feat/share-link](docs/changelogs/mr-08-transaction-dates-and-timezone.md)

#### Added

- Migration `0004_add_transaction_occurred_at_and_wallet_timezone` — `transaction.occurred_at`, `wallet.timezone` (default `Asia/Ho_Chi_Minh`)
- Timezone-aware period resolver (`#/lib/period-bounds.ts`), statement builder (`#/lib/statement.ts`), and `GET /api/wallets/:walletId/summary` for uncapped period totals
- `DatePicker` in `@vhnam/ui` with Storybook story; optional date on add/edit transaction and transfer dialogs
- `useWalletSummary` hook

#### Changed

- Transaction filters, default sort, and display use `occurred_at` instead of `updated_at` / `created_at`
- Summary cards use summary API (fixes wrong totals when a period exceeds one page)
- Period boundaries computed server-side in wallet timezone (fixes UTC preset and custom-range bugs)
- `PaginationLink` `size` prop is optional

#### Removed

- `netlify/functions/lib/date-ranges.ts`

### [mr-07 — refactor/import](docs/changelogs/mr-07-hash-import-alias.md)

#### Added

- Storybook stories for Attachment, Badge, and CurrencyInput components
- `#/` path alias in `@vhnam/ledger-box` and `@vhnam/ui`; `@vhnam/ui/vite` resolves `#/` for UI source and consuming apps

#### Changed

- Internal imports in `@vhnam/ui`, `@vhnam/ledger-box` (including Netlify functions and scripts), and Storybook migrated from relative/`@/` paths to `#/`
- `@vhnam/ui/vite` accepts optional `appSrc`; shadcn add script rewrites imports to `#/` instead of relative paths

#### Removed

- Manual Vite `resolve.alias` for `#` in ledger-box (handled by `@vhnam/ui/vite`)
- Relative-path conversion in the shadcn post-install script

### [mr-06 — feat/wallet-settings](docs/changelogs/mr-06-settings-member-invites.md)

#### Added

- Wallet Settings page at `/wallets/$walletId/settings` — rename wallet (General), invite/manage members with Viewer/Manager roles (Members), delete wallet (Danger zone)
- Members API: `GET` / `POST` / `PATCH` / `DELETE` `/api/wallets/:walletId/members`; `GET /api/users/by-email` for member lookup
- `PATCH` / `DELETE` `/api/wallets/:walletId` — update wallet name and soft-delete wallet with transactions
- Migration `0003_create_wallet_member`
- `Badge` component in `@vhnam/ui`
- React Query hooks for wallet members, wallet update, and wallet delete

#### Changed

- Wallet detail route nested under `wallets/$walletId/index.tsx` to support settings child route
- Wallet sidebar styling, create-wallet success toast, and delete-wallet navigation after removal

#### Removed

- Flat wallet route file `wallets/$walletId.tsx`

### [mr-05 — refactor/ui](docs/changelogs/mr-05-toast-theme-refresh.md)

#### Added

- Base UI toast component with imperative `toast.add({ title, description?, type? })` and stacked `Toaster` viewport

#### Changed

- **BREAKING:** Replaced Sonner — use `toast.add({ title, type: 'success' | 'error', ... })` instead of `toast.success` / `toast.error`
- App root mounts `Toaster` from `@vhnam/ui/components/toast`
- Regenerated Shadcn theme tokens (base-nova refresh); default radius `0.45rem` → `0.625rem`

#### Removed

- Sonner toast wrapper and `sonner` dependency

### [mr-04 — feat/multi-tenant](docs/changelogs/mr-04-multi-tenant-scoping.md)

#### Added

- Shared-schema multi-tenancy (v1): each wallet owned by `tenant_id` equal to the better-auth user id
- Migration `0002_add_wallet_tenant_id` — adds required `wallet.tenant_id`, backfills existing rows, indexes `tenant_id`
- `tenant-access.ts` helpers (`getTenantId`, `requireOwnedWallet`, `requireOwnedTransaction`); all wallet/transaction/attachment APIs scoped to authenticated tenant
- Tenant-scoped R2 object keys (`tenants/{tenantId}/...`); legacy key fallback for pre-tenant files
- CSV import scripts: `scripts/import-csv.ts`, `scripts/import-bank-csv.ts`

#### Changed

- Wallet transfer and transaction create/update/delete paths re-check `tenantId` on balance updates

#### Removed

- Demo seed script (`pnpm db:seed` / `pnpm db:reset`) and seed data module

**BREAKING:** Migration `0002_add_wallet_tenant_id` deletes orphan wallets when no better-auth users exist.

### [mr-03 — feat/manage-wallet](docs/changelogs/mr-03-transaction-crud-attachments.md)

#### Added

- `PATCH` / `DELETE` `/api/wallets/:walletId/transactions/:transactionId` — edit and soft-delete transactions with wallet balance adjustment
- Edit/delete transaction UI: detail sheet, edit dialog, delete confirmation, desktop row actions menu
- Transaction attachments via Cloudflare R2 — upload/list/delete APIs, attachments sheet with preview, client-side image optimization before upload
- `Attachment` and `CurrencyInput` components in `@vhnam/ui`
- Cloudflare R2 environment variables in `.env.example`

#### Changed

- Transaction list opens detail sheet on mobile; desktop shows inline actions menu
- Dialog and sheet headers use integrated close button

### [mr-02 — feat/wallet](docs/changelogs/mr-02-transactions-transfer-settings.md)

#### Added

- Wallet detail page at `/wallets/$walletId` with summary cards (income, expenses, net balance), actions toolbar, and transaction list
- Add transaction and transfer-between-wallets dialogs; `POST /api/wallets/transfer`
- Transaction APIs: `GET` / `POST` `/api/wallets/:walletId/transactions` with filter, sort, and pagination (URL-synced)
- Settings dialog with change-password (Account) and light/dark/system theme picker (Appearance)
- `@vhnam/utils` package — currency and date formatting helpers (VND defaults)
- UI components: Calendar, Collapsible, Date Picker Range, Empty, Pagination, Popover, Scroll Area, Select, Tabs, Toggle, Toggle Group; `theme-provider` and `use-theme`
- Seed script (`pnpm db:seed` / `pnpm db:reset`) with demo wallets and transactions
- Storybook stories for new UI components

#### Changed

- Wallet sidebar navigation with balance display and active-state highlighting
- Wallet page layout with scroll-area and responsive padding; pagination resets when switching wallets

### [mr-01 — feat/auth](docs/changelogs/mr-01-auth-google-oauth.md)

#### Added

- Email/password and Google OAuth authentication via Better Auth; auth Netlify function at `/api/auth/*`
- Protected app routes under `/_app` with session redirect to `/auth/login`
- Wallet CRUD API at `/api/wallets`; wallets page, create-wallet dialog, and sidebar wallet list
- PostgreSQL in `compose.yml`; Kysely with migration `0001_create_wallet_and_transaction`
- App shell with collapsible sidebar; root redirect from `/` to `/wallets`
- `@vhnam/ui` components (Avatar, Card, Dialog, Dropdown Menu, Field, Icon, Input, Label, Separator, Sheet, Sidebar, Skeleton, Sonner, Spinner, Textarea, Tooltip)
- Storybook app with UI component stories
- OXC formatter config; `.env.example` with required environment variables

#### Changed

- Replaced starter landing page with routed auth and app experiences
- Replaced `hello` Netlify function with `auth` and `wallets` functions

#### Removed

- `apps/ledger-box/netlify/functions/hello.mts`
- Root `/src` directory (unused)
