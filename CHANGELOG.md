# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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
