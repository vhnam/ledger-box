# MR 17 — Viewer Settings Access Fix

**Branch:** `fix/viewer-settings-access` → `main`

### Context

`viewer` is the only non-owner role granted in practice today — owners invite the
money recipient as a Viewer so they can check the wallet themselves. A viewer could
open `/wallets/$walletId/settings` (gear icon or direct URL), which stacks five
sections: general, activity, members, statement-shares, danger-zone.

An audit (`spdd/analysis/GGQPA-XXX-202608011200-Analysis-viewer-settings-access-fix.md`)
read all five backing endpoints directly. **No data-disclosure bug was found** — every
settings-adjacent endpoint already rejected a viewer server-side: `wallet-members.mts`,
`wallet-member.mts`, `wallet-statement-shares.mts`, and `wallet-activity.mts` via
`requireOwnedWallet` (404), and the wallet rename path in `wallet.mts` via
`requireWalletWriteAccess` (403). The actual gap was UI/route-only: the settings page
had no role guard, and the gear icon, danger-zone delete button, members list, and
statement-shares list all rendered unconditionally for a viewer, whose subsequent API
calls then failed. This is a UX/route fix with regression tests, not a security patch.

The audit also found `AGENTS.md`'s "Known gap" note (member APIs requiring wallet
ownership, invited users unable to see the wallet) to be stale — real member read
access was already implemented in MR 11.

### Fixed

#### Route- and navigation-level gating for viewers

- `wallet-settings-page.tsx` — redirects a `viewer` session to `/wallets/$walletId`
  before any settings section renders, matching the existing `isPending`/`isError`/
  `!walletPreview` early-return style.
- `wallet-actions.tsx` — the settings gear icon (linking to `/wallets/$walletId/settings`)
  is now hidden for `viewer` role; takes a new required `role` prop, passed from
  `wallet-page.tsx`.

Owner and manager settings access is unchanged. Viewer access to transactions, summary,
and attachments on the wallet page is unchanged. No API handler was modified — every
endpoint was already correctly owner/role-scoped.

### Added

- `netlify/functions/lib/tenant-access.test.ts` — new `requireOwnedWallet` coverage
  confirming an active viewer member and an active manager member are both denied with
  404 (strict-owner check, independent of `wallet_member` role), and the owner is
  granted — pinning down the guard shared by the members, statement-shares, activity,
  and wallet-delete endpoints.
- `spdd/analysis/GGQPA-XXX-202608011200-Analysis-viewer-settings-access-fix.md` and
  `spdd/prompt/GGQPA-XXX-202608011300-[Fix]-route-viewer-settings-access.md` — SPDD
  analysis and REASONS Canvas documenting the audit and fix design.

### Changed

- `AGENTS.md` — corrected the stale "Known gap" paragraph in the tenancy-scoping
  section: member read access is implemented via `requireWalletAccess` /
  `findAccessibleWallets`, and wallet settings are now gated to non-viewer roles at the
  route.

### Setup after merge

```bash
vp install
vp test   # includes the new tenant-access viewer/manager rejection tests
```

No migrations, no new environment variables.
