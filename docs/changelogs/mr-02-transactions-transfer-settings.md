# MR 02 — Transactions, Transfer & Settings

**Branch:** `feat/wallet` → `main`

### Added

#### Wallets

- Wallet detail page at `/wallets/$walletId` with header, summary, actions, and transaction list
- Wallet summary cards for income, expenses, and net balance (respects active filters)
- Add transaction dialog for recording income or expense against a wallet
- Transfer money dialog to move funds between wallets (requires at least two wallets)
- Wallet actions toolbar with collapsible filter/sort controls and quick-action buttons
- Empty states for no wallets and no transactions
- Sidebar wallet list with active-state highlighting and formatted balance display
- API route `POST /api/wallets/transfer` — transfer funds between two wallets (creates paired expense/income transactions)
- Valibot schemas for add-transaction and transfer-money

#### Transactions

- API route `GET /api/wallets/:walletId/transactions` — paginated list with filter and sort query params
- API route `POST /api/wallets/:walletId/transactions` — create income/expense and update wallet balance atomically
- Paginated transaction list with income/expense display, signed currency formatting, and loading/error/empty states
- Transaction filters: all time, today, this month, last month, and custom date range
- Transaction sorting by updated date or amount, ascending or descending
- URL-synced search params for filter, sort, and pagination
- React Query hooks and API client for listing and creating transactions

#### Settings

- Settings dialog with Account and Appearance tabs
- Change password form on the Account tab
- Light / dark / system theme picker on the Appearance tab

#### Utils package (`@vhnam/utils`)

- New shared package for currency and date formatting (date-fns)
- Currency helpers: `formatCurrency`, `formatShortCurrency`, `formatSignedCurrency` (VND defaults)
- Date helpers: formatting presets, relative dates, and range helpers (`getTodayRange`, `getThisMonthRange`, `getLastMonthRange`)

#### UI package (`@vhnam/ui`)

- New components: Calendar, Collapsible, Date Picker Range, Empty, Pagination, Popover, Scroll Area, Select, Tabs, Toggle, Toggle Group
- `theme-provider` and `use-theme` hook for light/dark/system appearance
- `Icon` component improvements (name-based and component-based usage)
- `fonts.css` and Tailwind entry updates

#### Storybook (`@vhnam/storybook`)

- Stories for new UI components (calendar, collapsible, date-picker-range, dialog, empty, pagination, popover, scroll-area, select, sonner, spinner, tabs, theme-provider, toggle, toggle-group)

#### Database

- Seed script (`pnpm db:seed` / `pnpm db:reset`) with demo wallets and transactions
- Seed data module with sample income and expense records

#### App shell

- Settings entry in the sidebar user menu
- Scroll-area layout on the wallet page with responsive padding

#### Tooling

- Root and package-level READMEs for setup, structure, and development workflow
- `packages/utils` added to the pnpm workspace

### Changed

- Wallet sidebar navigation redesigned with balance display and improved collapsed/expanded layout
- Wallet page layout refactored with scroll-area, responsive padding, and smoother transitions
- Wallet page resets pagination to page 1 when switching wallets
- Transaction mutations invalidate wallet and transaction queries to refresh balances
- Wallet and transaction migration/schema tweaks to support the new features
- Formatter config (`.oxfmtrc.json`) and `.gitignore` updates
- `netlify.toml` dev config adjusted for local development

### Setup after merge

```bash
vp install
docker compose up -d
pnpm --filter @vhnam/ledger-box db:migrate
pnpm --filter @vhnam/ledger-box db:seed   # optional: load demo wallets and transactions
vp run dev
```

### Commits

- `48783cb` feat(wallet): view Wallet details
- `ae4c26c` chore: update README.md
- `6b286d5` feat(wallet): display transactions
- `ef40402` feat(wallet): display transactions
- `72b3586` feat(transactions): support filter, group, sort
- `3e82c51` chore: update README.md
- `388359c` refactor(wallets): update UI and animations
- `c088c76` feat(wallet): able to transfer between wallets
- `d576264` feat(wallet): add transaction
