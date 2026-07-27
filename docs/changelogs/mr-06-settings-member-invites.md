# MR 06 — Settings & Member Invites

**Branch:** `feat/wallet-settings` → `main`

### Added

#### Wallet settings

- Wallet Settings page at `/wallets/$walletId/settings` with back navigation to the wallet
- **General** — rename wallet (form + save)
- **Members** — invite by email with Viewer/Manager role, role descriptions, member list with avatars, Owner/Pending invite badges, role updates, and removal
- **Danger zone** — delete wallet with confirmation dialog (desktop dialog / mobile sheet)
- Settings gear on the wallet page links to the settings route

#### Members API & persistence

- `wallet_member` table (migration `0003_create_wallet_member`) with email, role, status, optional `user_id`, soft delete, and unique email per wallet
- `GET /api/wallets/:walletId/members` — wallet owner + invited members
- `POST /api/wallets/:walletId/members` — send invite (default role: Viewer)
- `PATCH /api/wallets/:walletId/members/:memberId` — update member role
- `DELETE /api/wallets/:walletId/members/:memberId` — remove member
- `GET /api/users/by-email` — look up better-auth user by email for member display
- `PATCH` / `DELETE` `/api/wallets/:walletId` — update wallet name and soft-delete wallet + transactions
- React Query layer: `useWalletMembers`, `useInviteWalletMember`, `useUpdateWalletMemberRole`, `useRemoveWalletMember`, `useUpdateWallet`, `useDeleteWallet`

#### UI (`@vhnam/ui`)

- New `Badge` component (`packages/ui/src/components/badge.tsx`) with variants: `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`

#### Shared utilities

- `#/lib/avatar` — `getAvatarFallbackFromName` / `getAvatarFallbackFromEmail` (used in sidebar user and member list)

#### Schemas & constants

- `wallet-member.schema.ts` — invite and update-role validation
- `wallet-member-role-options.ts` — Viewer/Manager options and descriptions
- `wallet-member.dto.ts` — member response type

### Changed

#### Routing

- Wallet detail route moved from `wallets/$walletId.tsx` to `wallets/$walletId/index.tsx` (nested layout for settings child route)

#### Wallet UI

- Sidebar wallet list: tighter spacing, active wallet icon uses `foreground`/`background`, active row uses `secondary` styling
- `wallet-actions` route API updated to `/_app/wallets/$walletId/`
- Create wallet dialog: success toast on create; submit uses typed `CreateWalletSchema`
- Delete wallet dialog navigates to another wallet or `/wallets` after delete

#### Notifications

- Sidebar user avatar fallback uses shared `getAvatarFallbackFromName`

### Removed

- Flat wallet route file `apps/ledger-box/src/routes/_app/wallets/$walletId.tsx` (replaced by index + settings routes)

### Setup after merge

```bash
vp install
pnpm --filter @vhnam/ledger-box db:migrate
```

Run the database migration before using member invites. Member APIs require an authenticated session and wallet ownership (`tenant_id`).

### Commits

- `1a5aeda` feat(wallet): can manage members
- `ca6b5bb` feat(wallet): add Wallet Settings page
- `4ffb5bd` refactor(wallet): update UI for wallet
