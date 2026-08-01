# MR 15 — Member Invitation Emails

**Branch:** `feat/member-invitation-emails` → `main`

### Context

Wallet member invites (MR 06 / MR 11) persisted rows and could activate on matching
sign-in, but owners had no outbound email and no tokenized accept link. Invitees
learned about access only if the owner told them out of band. This change sends
invite/resend mail via Resend, stores a hashed invite token with expiry, and adds a
public verify page — without treating mail delivery failure as invite failure.

### Added

#### Invite tokens & rate limits

- Migration `0008_add_wallet_member_invite_token` — `invite_token_hash`,
  `invite_token_expires_at`, `last_invited_at`, `invite_send_count` on
  `wallet_member`; unique index on non-null token hash; per-wallet invite rate
  window columns on `wallet`
- Activity log actions extended with `invite_resend` and `invite_email_failed`

#### Email delivery

- `netlify/functions/lib/mailer.ts` — Resend client wrapper
- `netlify/functions/lib/wallet-invite-email.ts` — invite email body + send helper
- Catalog dependency `resend`; env `RESEND_API_KEY` and `RESEND_EMAIL_FROM_ADDRESS`
  (optional in local dev — invite/resend still persist, response includes
  `emailSent: false`, and `invite_email_failed` is logged)

#### APIs

- Invite create (`POST /api/wallets/:walletId/members`) issues a token, sends mail,
  returns `emailSent`
- `POST /api/wallets/:walletId/members/:memberId/resend` — owner-only resend for
  pending invites (rate limited per owner/wallet)
- `GET /api/wallets/invites/:token` — public, unauthenticated invite-token
  verification (no accept/activation write in this handler)

#### UI

- Public route `/invite/$token` with invite status page
- Members settings: resend pending invite action + TanStack Query mutations
- App branding: `public/logo.svg` + `favicon.ico` in the sidebar and document head

#### Storybook

- Ledger Box favicon, logo, and sidebar brand lockup (`brand.svg`) for the manager UI
- Storybook catalog bump to `^10.5.5` with viewport globals migration (`initialGlobals`
  / story `globals` instead of deprecated `parameters.viewport.defaultViewport`)

#### Docs

- SPDD analysis and feature prompt under `spdd/analysis/` and `spdd/prompt/`
- `AGENTS.md` API table and env notes for invite email + resend/verify routes

### Changed

- Member invite flow always persists the invite first; email is best-effort
- Wallet activity log constraint allows the new invite email actions

### Out of scope (v1)

- Closing the known gap where invited members still lack wallet read access after
  sign-in (tenancy model change — see `AGENTS.md`)
- Authenticated accept endpoint that activates the invite on token redeem
  (verify page is read-only; activation still follows existing member matching rules)

### Setup after merge

```bash
vp install
pnpm --filter @vhnam/ledger-box db:migrate   # applies migration 0008
# optional for outbound mail:
# RESEND_API_KEY=...
# RESEND_EMAIL_FROM_ADDRESS=...
vp check && vp test
```

### Commits

- `6a9210d` feat: upgrade Storybook
- `28f31b2` feat(storybook): add Logo
- `6be1d78` feat(ledger-box): member invitation emails
