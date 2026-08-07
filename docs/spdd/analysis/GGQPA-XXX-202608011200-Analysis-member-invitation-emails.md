# SPDD Analysis: Member Invitation Emails

## Original Business Requirement

Feature: member invitation emails.

Read `AGENTS.md` and MR 06 / MR 11 changelogs first.

Problem: `POST /api/wallets/:walletId/members` records a pending invite, and MR 11 makes
pending invites auto-activate when a matching session appears — matched by `user_id` or
case-insensitive email. But nothing notifies the invited person. Today they only gain
access if they happen to register and sign in on their own. In practice the owner must
tell them out-of-band, which makes the whole member feature close to unusable.

Scope to analyse:

- Sending an email on invite, containing who invited them, which wallet, and a link.
- What the link does for a recipient who has no account versus one who already does.
- Whether the invite link carries a token, or whether email-match auto-activation from
  MR 11 is sufficient and the email is purely a notification. Argue the security
  difference: a pure notification means anyone who registers with that email address
  gains access.
- Resending and revoking an invite.
- Whether invite emails need rate limiting, given the endpoint accepts arbitrary
  addresses and could be used to send mail to strangers.

Surface, before proposing a design:

- What email delivery mechanism fits this stack. The app runs on Netlify Functions with
  no mail provider configured today — identify what would need adding, including new
  environment variables.
- Whether better-auth already provides an email-sending hook this could reuse, and
  whether verification email infrastructure exists.
- What happens when email delivery fails: does the invite still persist, and how does the
  owner find out.
- Whether the invited person's email address appearing in the wallet member list is
  itself a disclosure concern.

Do not produce a REASONS Canvas yet. Output the analysis only.

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **`wallet_member`** (`apps/ledger-box/src/lib/db/schema.ts:30`, migration `0003_create_wallet_member`,
  index added in `0006_add_wallet_member_user_lookup_index`): the invite record itself —
  `email`, `role` (`viewer`/`manager`), `status` (`pending`/`active`), optional `user_id`,
  soft delete. Owned by a `wallet`, addressed by `walletId` + case-insensitive `email`.
  This is the entity a notification email would be triggered from and would need a
  resend/revoke lifecycle layered on top of.
- **Pending-invite auto-activation** (`tenant-access.ts:105-153`, `requireWalletAccess`):
  the existing access-control mechanism that flips a `pending` member row to `active` the
  moment a session is seen whose `user_id` matches, or whose email matches
  case-insensitively when `user_id` is still null. This is already the sole grant-of-access
  mechanism today — it happens on _any_ authenticated request to a wallet route, not on a
  dedicated "accept invite" action. Any email design has to either ride on top of this
  mechanism as pure notification, or introduce a new, separate acceptance path.
- **`wallet_activity_log`** (migration `0007`, `lib/activity-log.ts`, `recordActivity`):
  append-only audit trail already used to record the `invite` action when a member is
  created (`wallet-members.mts:138-148`). A natural place to also record "invite email
  sent" / "invite email failed" / "invite resent" / "invite revoked" events, consistent
  with the existing pattern of logging member mutations in the same Postgres transaction.
- **`wallet-statement-share` token pattern** (`lib/share-token.ts`, `wallet-statement-shares.mts`,
  `public-statement.mts`): the codebase's only existing precedent for an unauthenticated,
  link-based access mechanism. It generates a 256-bit CSPRNG token, persists only the
  SHA-256 hash (`tokenHash`), returns the raw token once, and later verifies by hashing the
  presented token and doing a lookup (constant-time compare helper also exists,
  `verifyTokenConstantTime`, though `public-statement.mts` currently relies on hash-lookup
  equality rather than that helper — worth noting as an existing inconsistency, not
  something this feature needs to fix). It also has DB-column-based fixed-window rate
  limiting (`rateWindowStart`/`rateWindowCount` on the share row) enforced per-token on the
  public GET route. This is the strongest structural precedent for "should invites carry a
  token" and for "how do we rate-limit an unauthenticated-reachable action" — both the
  token shape and the rate-limit shape can likely be reused almost directly.
- **better-auth** (`apps/ledger-box/src/lib/auth.ts`): configured with `emailAndPassword`
  and Google OAuth only. No `sendResetPassword`, no `emailVerification` block, no
  `sendVerificationEmail` hook — i.e. better-auth is not currently sending any email of any
  kind. It does support such hooks in general (they're documented in the better-auth
  library `apps/ledger-box` depends on and are the idiomatic place to plug in a mail
  provider), so wiring one up for password reset / email verification is a proximate but
  currently-absent capability. This feature does not need those hooks — invite email is not
  an auth-flow email — but a shared "send email via provider X" helper is likely to be
  useful for both this feature and future auth email needs, so the delivery mechanism
  should be built as a general-purpose helper, not invite-specific.
- **`findUserByEmail` / `findUserById`** (`lib/user-lookup.ts`, used throughout
  `wallet-members.mts`): resolves whether an invited email already has a better-auth
  account. This is exactly the signal needed to decide "recipient has no account" vs.
  "recipient already has an account" for the link's destination.
- **`RESEND_API_KEY`**: present in `.env.example` and mentioned in the MR 14 changelog
  (`docs/changelogs/mr-14-getting-started-tutorial.md`) as a documented-but-optional
  variable ("Ensure RESEND_API_KEY is set if your environment uses it"), and in
  `CHANGELOG.md`. Grepping the entire codebase turns up **zero** references to it in
  actual code — no import of a Resend client, no usage anywhere in `netlify/functions` or
  `src/lib`. This is a dangling placeholder: someone anticipated needing email (plausibly
  for this exact feature) and reserved the env var name, but never implemented delivery.
  This is a strong signal — not proof — that Resend is the intended provider, but it means
  "add Resend" is not fully greenfield; the env var slot already exists and should be
  reused rather than renamed.

#### New Concepts Required

- **Invite email delivery mechanism**: a mail-sending capability that does not exist
  anywhere in the app today (Netlify Functions have no outbound email integration). Needs
  a provider (Resend, given the dangling env var, is the leading candidate — see Risk
  section for why this still needs confirming rather than assuming) and a thin wrapper
  function/module, plus the new environment variable(s) that provider requires (at minimum
  an API key, likely also a from-address / verified sending domain, since Resend requires
  domain verification for anything beyond its sandbox sender).
  Relates to: `wallet_member` (data source), better-auth (adjacent but not reused directly
  for this feature).
- **Invite acceptance token** (if the security argument in Risk & Gap Analysis is accepted
  — see below): a per-invite secret, analogous to `walletStatementShare.tokenHash`, that
  the link carries and that a dedicated "accept invite" action verifies before doing
  anything that changes access. This is materially different from the _existing_
  auto-activation mechanism (which trusts session email/user_id alone, no token) and the
  central open question of this analysis is whether it's introduced as a genuine
  authorization gate or omitted in favor of the status quo mechanism.
- **Invite email send state**: some way to know whether the notification for a given
  `wallet_member` row was actually delivered — at minimum for the resend flow to make
  sense, and for the owner to learn about a delivery failure. Candidates: a field on
  `wallet_member` (e.g. `lastInvitedAt`/`inviteEmailStatus`), rows in
  `wallet_activity_log`, or both. Relates to `wallet_member` and `wallet_activity_log`.
- **Resend / revoke invite operations**: resend is essentially "re-trigger the email send
  for an existing pending `wallet_member`" (with its own rate limit, since it's the most
  obvious enumeration/spam vector — see Risk section). Revoke is most naturally the
  _existing_ `DELETE /api/wallets/:walletId/members/:memberId` soft-delete path
  (`wallet-member.mts`, not read in full above but referenced in MR 06 changelog as
  "remove member") — the open question is whether "revoke a pending invite" needs to be a
  distinct concept from "remove a member" at all, or whether the existing delete endpoint
  already covers it and only needs a small behavioral check (e.g. can only revoke while
  still `pending`, or revoking active members is a different, already-solved case).
- **Per-recipient / per-owner rate limiting for invite sends**: distinct from the existing
  statement-share rate limiting (which throttles read access to a public link).
  Here the concern is the _owner's_ endpoint being used to spray emails to arbitrary
  addresses the owner doesn't control. Needs a new limiting dimension — plausibly
  per-tenant (owner) and/or per-target-email — that doesn't have a direct precedent in the
  codebase yet, though the DB-column fixed-window pattern from `walletStatementShare` is
  structurally reusable.

#### Key Business Rules

- **An invite email must not itself grant access.** Sending mail is a side effect of
  creating a `wallet_member` row; the row (and MR 11's auto-activation) is what already
  governs access. This governs `wallet_member` and the new email-sending step — the two
  must stay decoupled so that email delivery failure can never block or silently skip
  the actual invite.
- **The invite must remain useful without email.** Per AGENTS.md's existing framing
  ("today they only gain access if they happen to register and sign in on their own"),
  MR 11's auto-activation is already suficient for access; email is additive UX, not a new
  access-control layer, _unless_ the token-based design is chosen — in which case this
  rule is superseded by the next one.
- **If a token is introduced, only the token holder should be able to complete
  acceptance via the link — not merely "anyone who later registers with that email."**
  This governs the new token concept and directly supersedes relying on MR 11's
  email-match auto-activation as sufficient, if adopted (see Risk & Gap Analysis for the
  full argument both ways).
- **Invite emails must not become an arbitrary-address mail relay.** Governs the new
  rate-limiting concept: the invite endpoint already accepts any email string
  (`wallet-members.mts:86-94`, no domain or deliverability check), and turning that into
  an automatic email send makes the wallet owner's account a potential vector for sending
  mail to strangers (spam, phishing-adjacent abuse, or just cost).
  Existing precedent for defending against a similar "unauthenticated actor drives cost/
  volume" shape is the statement-share rate limit, but that throttles _reads_ of a link,
  not _sends_ — this is a new dimension (send-side, tied to the owner or the endpoint,
  not to a token).
- **Tenancy/ownership rules from AGENTS.md still apply.** Every wallet-scoped mutation
  (invite create, resend, revoke) must continue to go through `requireOwnedWallet` —
  member management stays owner-only per both the AGENTS.md tenancy section and the MR 11
  changelog ("deleting the wallet or managing members/statement-shares, which stay
  owner-only"). This feature must not weaken that.
- **Balance/money invariants are not implicated** — this feature does not touch
  `wallet.balance`, `transaction`, or `wallet_activity_log`'s append-only money-affecting
  entries (it may still _write_ activity-log rows for the invite/email lifecycle, which is
  consistent with the existing member-invite activity logging already in place).

## Strategic Approach

#### Solution Direction

The overall shape follows the pattern already established by `wallet-statement-shares.mts`

- `public-statement.mts` + `share-token.ts`: a wallet-owner-only authenticated endpoint
  does the mutation and (now) triggers a side-effecting email send; a lightweight,
  provider-backed mail helper sends the message; and, if tokens are adopted, a public,
  unauthenticated endpoint verifies a hashed token before doing anything privileged. Data
  flow: `POST /members` (existing) → persist `wallet_member` row (existing) → **new:**
  generate token (optional, see below) → **new:** call mail-send helper in the same request,
  outside the DB transaction that created the row → **new:** record delivery outcome
  (activity log and/or a status column) → response to owner reflects whether the email sent.
  Resend reuses the same mail-send helper against the existing pending row. Revoke reuses the
  existing member soft-delete path, with the additional constraint that it only makes sense
  pre-activation.

The mail delivery mechanism itself should be a new, provider-agnostic helper module
(e.g. `netlify/functions/lib/email.ts` or `src/lib/email.ts`, mirroring the
`lib/share-token.ts` / `lib/activity-log.ts` shape) wrapping whichever provider is chosen —
almost certainly Resend, given the already-reserved `RESEND_API_KEY`. This keeps the
provider swappable and gives future auth-flow emails (password reset, verification) a
shared foundation, without actually wiring better-auth's email hooks as part of this
feature (out of scope; better-auth's hooks are for auth-flow emails, invite email is a
different trigger point in `wallet-members.mts`).

#### Key Design Decisions

- **Token-carrying link vs. notification-only link**: trade-off is security vs. reuse of
  the existing MR 11 mechanism.
  - _Notification-only_ (link just deep-links into the app, e.g. `/wallets/:id` or a
    sign-up page prefilled with the invited email): trivial to build, zero new schema, but
    inherits MR 11's actual security model — **anyone who registers or signs in with that
    email address gets auto-activated**, whether or not they ever received or clicked the
    email. The email becomes purely cosmetic; it does not add or remove any capability an
    attacker didn't already have under MR 11.
  - _Token-carrying_ (link encodes a per-invite secret, verified before any activation
    step tied to that specific invite): requires new schema (token hash + likely expiry on
    `wallet_member`, or a new lookup table), a new public verification endpoint, and forces
    a decision about how it interacts with MR 11's existing email-match auto-activation
    (does the token _replace_ email-match activation, or run alongside it as a second,
    independent path to the same access?).
  - **Recommendation**: surface this as the single most important open decision for
    REASONS Canvas rather than resolve it here (see Risk & Gap Analysis) — the two options
    produce materially different security postures and schemas, and the requirement text
    explicitly asks the analysis to "argue the security difference" rather than pick.
- **Where email delivery happens relative to the DB write**: send synchronously inside the
  `POST /members` handler, after the transaction commits, vs. queue it for out-of-band
  send. Netlify Functions have no built-in queue/worker infra in this repo (no evidence of
  one), so introducing a queue would be new infrastructure disproportionate to the feature.
  **Recommendation**: synchronous send after commit, with the invite row's persistence
  never rolled back or blocked by a mail failure — matches the business rule that email is
  additive, not access-gating.
- **Provider choice**: `RESEND_API_KEY` is already reserved in `.env.example` and
  referenced in the MR 14 changelog, suggesting Resend was already anticipated.
  **Recommendation**: adopt Resend, add whatever companion variables it requires (from
  address, possibly a verified domain identifier) — flagged as needing confirmation, not
  assumed as complete (see Risk & Gap Analysis, delivery-mechanism ambiguity).
- **Rate limiting shape**: reuse the DB-column fixed-window pattern from
  `walletStatementShare`/`public-statement.mts` rather than inventing a new mechanism (e.g.
  in-memory limiter, which wouldn't work reliably across stateless Netlify Function
  invocations anyway). **Recommendation**: rate-limit on the owner/tenant performing the
  invite-send action (create + resend), since the abuse vector here is an authenticated
  owner spraying mail to arbitrary strangers, not an anonymous caller hitting a public
  link.

#### Alternatives Considered

- **Piggyback on better-auth's email hooks** (`sendVerificationEmail`/similar) to deliver
  the invite notification: rejected as a poor fit — those hooks fire in response to
  better-auth's own auth-flow events (password reset, email verification, new-account
  sign-up), not in response to a `wallet_member` row being created, which is domain logic
  unrelated to auth. Using them would require awkwardly forcing an invite to masquerade as
  an auth event. A shared low-level mail-sending helper, _not_ the auth-flow hooks
  themselves, is the right level of reuse.
- **Async email delivery via a queue/worker**: rejected for this iteration — no queueing
  infrastructure exists in the stack today (Netlify Functions + Postgres + R2 only), and
  introducing one is disproportionate to a transactional, single-recipient email send.

## Risk & Gap Analysis

#### Requirement Ambiguities

- **Token vs. notification-only is left unresolved by the requirement itself** — it asks
  the analysis to "argue the security difference," not to decide. This is the central
  design fork and must be resolved (likely with the user) before REASONS Canvas, since it
  changes the schema, the endpoint surface, and the acceptance flow substantially.
  - The security argument, laid out plainly: under MR 11's existing behavior, access to a
    wallet is granted the moment a session is seen whose email matches the invite,
    case-insensitively, regardless of _how_ that person learned of or reached the wallet.
    A notification-only email changes nothing about who can gain access — it only changes
    whether the legitimate invitee is _told_ to go sign up. The actual risk MR 11 already
    accepts is: if an attacker can register an account using the victim's exact email
    address (i.e., if better-auth allows account creation with an unverified/arbitrary
    email — this needs confirming from better-auth's config, since `emailAndPassword` is
    enabled with no visible `requireEmailVerification` flag in `auth.ts`), that attacker
    inherits the invite. A token-carrying link does not fix that underlying gap by itself
    unless activation is _changed_ to require the token instead of (or in addition to) the
    email match — otherwise the token is just an alternate, no-safer path sitting next to
    a still-open email-match path. So: a token only closes the gap if it also route around
    or tightens MR 11's email-match branch; token-as-pure-notification-plus-existing-auto-
    activation buys nothing.
- **"Contains who invited them, which wallet, and a link"** — unspecified whether the
  wallet's _name_ is safe to put in a plaintext email to an address that hasn't proven it
  belongs to anyone in particular, given the app's premise (money tracking, sometimes money
  held for others) — see disclosure question below.
- **"Resending an invite"** — unspecified whether resend should invalidate a previous
  token (if tokens are adopted) or just re-send with the same one; unspecified whether
  there's a cooldown between resends distinct from the general send-rate-limit.

#### Edge Cases

- **Invitee already has an active account under a different email casing** (`findUserByEmail`
  lowercases before lookup, consistent with the case-insensitive matching in MR 11) — link
  destination logic must use the same lowercase-normalized lookup the auto-activation path
  uses, or the "already has an account" branch could disagree with what MR 11 will actually
  do when the person signs in.
- **Owner invites the same email twice after the first invite was soft-deleted** — the
  existing `POST` handler already blocks a second invite only while `deletedAt is null`
  (`wallet-members.mts:107-117`); a previously-revoked-then-reinvited row means a
  resend/new-invite email needs to target the _current_ pending row, not a stale one.
- **Invite sent to an address that is the wallet owner's own email under different
  casing** — already blocked (`wallet-members.mts:103-105`), no new risk, but the email
  step must not run before that check (it already runs after, per current ordering — no
  change required, just confirm the new step is inserted after existing validation, not
  before).
- **Wallet is deleted (soft-delete) between invite creation and email send/resend/token
  click** — needs a defined response for a token-based accept flow (mirrors
  `public-statement.mts`'s existing "wallet deleted → 410" handling, which is a direct,
  reusable precedent).
- **Recipient never had an account, clicks link, but registers with a _different_ email
  than the one invited** — under email-match auto-activation this invite is simply never
  claimed by them; if a token exists, does the token itself grant access independent of
  which email the clicking user is logged in as? This interacts directly with the token
  vs. notification decision above and needs explicit resolution.
- **Mail provider send failure** (network error, invalid/unverified domain, provider
  outage) mid-request — must not roll back the already-committed `wallet_member` insert
  (the insert happens in its own transaction already, per current code, before any email
  step would be added) and must surface a distinguishable failure state to the owner
  (toast + some persisted status) rather than a generic 500, since AGENTS.md's error
  visibility expectations aren't explicit here but the existing UI pattern
  (`toast.add`) implies user-facing feedback is expected for any owner-facing action.

#### Technical Risks

- **No mail provider is wired in anywhere in the codebase today** — this is a from-scratch
  integration, not a config toggle. Confirmed by grep: `RESEND_API_KEY` appears only in
  `.env.example` and changelog prose, never in code. Risk: assuming Resend without
  confirming is itself a risk — the variable name could have been reserved speculatively
  without the provider decision actually being finalized; this should be confirmed with
  the user rather than treated as settled, even though it's the strongest available signal.
- **Resend (or any transactional-email provider) requires a verified sending domain for
  production use** — sandbox/test modes typically only deliver to the account owner's own
  verified address, which is unusable for real invites to third parties. This means
  "add RESEND_API_KEY" is necessary but not sufficient; a verified from-domain and likely a
  `RESEND_EMAIL_FROM_ADDRESS`-shaped variable are also needed, and domain verification is an
  out-of-band setup step (DNS records) that can't be completed by writing code — needs
  flagging as a deployment/setup dependency, not just an env var addition.
- **better-auth email-verification state is unclear** — `auth.ts` enables
  `emailAndPassword` without any visible `requireEmailVerification`/`sendVerificationEmail`
  configuration. If email verification is _not_ enforced, the security argument above (an
  attacker registering with an arbitrary, unverified email inherits any pending invite for
  that address) is a live gap that predates this feature and is inherited by it, not
  introduced by it — worth surfacing to the user as adjacent risk even though fixing
  better-auth's verification posture is out of scope for "member invitation emails."
- **Fixed-window rate limiting reused from `walletStatementShare` is per-token/per-row**;
  this feature's abuse vector is per-_owner_-action (an authenticated tenant spamming the
  invite endpoint with many different target emails), which doesn't have a single row to
  attach a counter to in the same way. Needs either a new table, a counter on `wallet` or
  on the session/tenant, or reuse of `wallet_member` rows filtered by `createdAt` with a
  query-based count — a genuine new design surface, not a drop-in reuse.
- **Netlify Functions are stateless per-invocation** — any in-memory rate limiting is
  unreliable across concurrent/cold-start invocations; must be DB-backed, consistent with
  the existing `walletStatementShare` approach and the project's lack of any cache/queue
  infra (Redis, etc. — not present in `compose.yml`, which only provides Postgres per
  AGENTS.md's workflow section).

#### Acceptance Criteria Coverage

No formal acceptance criteria were provided in the requirement — it is written as a
problem statement plus a scope-to-analyse list. Mapping the scope bullets as pseudo-ACs:

| AC# | Description                                                                | Addressable?                         | Gaps/Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | -------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Send an email on invite with inviter, wallet, and a link                   | Yes                                  | Delivery mechanism must be built from scratch (no provider wired in); wallet-name disclosure question (see below) needs a decision                                                                                                                                                                                                                                                                                                                         |
| 2   | Link behavior differs for account-less vs. existing-account recipient      | Partial                              | `findUserByEmail` already gives the signal; destination logic (sign-up prefill vs. sign-in redirect vs. direct-to-wallet) is undesigned and depends on the token decision                                                                                                                                                                                                                                                                                  |
| 3   | Token-carrying vs. notification-only, with security argument               | Partial                              | Security argument is provided above; the actual decision is explicitly deferred to REASONS Canvas / user input, per the requirement's own instruction not to resolve it here                                                                                                                                                                                                                                                                               |
| 4   | Resend and revoke                                                          | Partial                              | Revoke likely reuses existing `DELETE /members/:memberId`; resend needs a new endpoint or a `POST`-with-existing-row path plus its own rate-limit; neither designed yet                                                                                                                                                                                                                                                                                    |
| 5   | Rate limiting given arbitrary-address acceptance                           | Yes (direction), Partial (mechanism) | Abuse vector and reusable pattern (DB fixed-window) identified; exact counter attachment point (owner vs. tenant vs. new table) undesigned                                                                                                                                                                                                                                                                                                                 |
| 6   | Identify delivery mechanism fitting the stack, incl. new env vars          | Yes                                  | Resend is the strong candidate (dangling `RESEND_API_KEY`), but needs confirming with the user; companion vars (from-address/domain) identified as also required                                                                                                                                                                                                                                                                                           |
| 7   | better-auth email hook reuse / verification infra check                    | Yes                                  | Confirmed: no hooks configured, no verification infra exists; better-auth hooks are the wrong reuse target for this feature regardless                                                                                                                                                                                                                                                                                                                     |
| 8   | Behavior on delivery failure: does invite persist, how does owner find out | Yes (direction)                      | Recommendation given (persist always, surface failure via activity log/status + toast); exact status-tracking schema undesigned                                                                                                                                                                                                                                                                                                                            |
| 9   | Email-in-member-list disclosure concern                                    | Yes                                  | `GET /members` already returns `email` for every row to the owner only (owner-only route per `requireOwnedWallet`); this is not a _new_ disclosure introduced by this feature — the member list already shows invitee emails today. The new disclosure surface this feature adds is the _outbound_ email itself (wallet name + inviter identity sent to an unverified address), which is the one requiring a decision, not the existing in-app member list |
