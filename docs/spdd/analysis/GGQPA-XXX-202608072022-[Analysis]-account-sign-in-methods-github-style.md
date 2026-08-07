# SPDD Analysis: Account Settings — GitHub-style Sign-in Methods

## Original Business Requirement

> with the idea to clone the Password and Authentication from GitHub, please update the current Account page like that

Supporting reference: two screenshots of GitHub's `github.com/settings/security` page ("Password and authentication"), showing:

- A **"Sign in methods"** card containing stacked rows, each with a leading icon, a bold title, a muted one-line status description underneath, and a right-aligned action button:
  - **Email** — icon: envelope; description: "2 verified emails configured"; action: "Manage"
  - **Password** — icon: key/password glyph; description: "Configured"; action: "Change password"
  - **Passkeys** — icon: person-with-key; description: "1 passkey configured" (expandable); action: "Add passkey"
  - **Google** — icon: Google "G" logo; description: "Sign in with your Google account"; action: "Connect"
  - **Apple** — icon: Apple logo; description: "Sign in with your Apple account"; action: "Connect"
- A separate **"Two-factor authentication"** section below (status badge "Enabled", explanatory copy, "Preferred 2FA method" card, "Two-factor methods" list with Authenticator app / SMS / Security keys / GitHub Mobile rows each showing a status badge + Edit/Add/Show action, and a "Recovery options" section with a Recovery codes row).

The user's own account currently authenticates via **Google** and **Email/Password**. The ask is to reshape the existing Account settings page in this app to adopt this "list of sign-in method rows" pattern instead of the current bare "Change password" form.

## Domain Concept Identification

#### Existing Concepts (from codebase)

- **User / Session** (`apps/ledger-box/src/lib/auth.ts`, `auth-client.ts`): better-auth-backed identity, read today only via `authClient.getSession()` in `routes/_app/route.tsx`. Exposes the user's `email`, `emailVerified`, `name` per better-auth's default user schema. This backs the "Email" row.
- **Email/Password credential** (`emailAndPassword: { enabled: true }` in `auth.ts`): already the sole credential type wired into UI today, via `SettingsAccount` / `useSettingsAccountActions` (`apps/ledger-box/src/modules/settings/settings-account/`), which calls `authClient.changePassword(...)`. Maps directly to the "Password" row's "Change password" action — this is the one row that's already fully implemented.
- **Social provider — Google** (`socialProviders.google` in `auth.ts`): configured server-side (client ID/secret from env) so Google sign-in already works at login/signup time. However, there is **no client-side code anywhere in the app** that lists a user's linked accounts, or connects/disconnects a social provider from an existing session. This is a new concept to introduce at the UI/query layer, backed by better-auth's built-in (but currently unused) `authClient.listAccounts()` / `linkSocial()` / `unlinkAccount()` methods.
- **Icon registry** (`packages/ui/src/components/icon.tsx`): a curated allowlist re-exporting a subset of `@phosphor-icons/react` icons via an `IconName` union — every icon used in the app must be added here first. Today it has no envelope, key/password, or brand-logo (Google/Apple) icons.

#### New Concepts Required

- **Sign-in method row**: a presentational concept — icon + title + status description + action button — used to render each authentication method uniformly. Relates to the "Existing Concepts" above as the display wrapper around each of them (Email, Password, Google).
- **Linked social accounts data**: the set of OAuth providers currently connected to the signed-in user (e.g., is Google linked?). Needed to decide whether a row's action button reads "Connect" vs. some "Connected"/"Disconnect" state. This is new — no query or DTO exists for it today.
- **Connect / Disconnect Google flow**: user-triggered action to link or unlink the Google provider from an already-authenticated account (distinct from "sign in with Google" at login, which already exists). New client-side flow.

#### Key Business Rules

- **Password rows require an existing password credential**: better-auth's `changePassword` assumes a password credential already exists; a user who signed up purely via Google would have no password to "change" — the row's language/action may need a "Set password" variant for that case. (Not explicitly stated by the user, but implicit given "My account is using Google Authentication and Email/Password" — i.e., both credentials coexist for this account, but the UI must not assume every user has both.)
- **Email verification status governs "Manage"**: GitHub's row shows "2 verified emails configured" — the count and verified state come from the account's registered emails. This app has no multi-email concept; only a single account email exists (from `user.email`/`user.emailVerified`). The row's description must be scoped down accordingly (see Risks).
- **A row's action must reflect real linkage state**: a "Connect" button must only render for providers not yet linked to the current session; a linked provider should show a different affordance (e.g., "Disconnect" or a "Connected" indicator) rather than always showing "Connect".
- **Unlinking must not lock the user out**: better-auth's `unlinkAccount` and general auth-provider hygiene typically requires the user retain at least one working sign-in method (password or a remaining linked provider) — disconnecting the only sign-in method must be prevented or guarded.

## Strategic Approach

#### Solution Direction

Restyle `SettingsAccount` (`apps/ledger-box/src/modules/settings/settings-account/settings-account.tsx`) into a **"Sign in methods"** `Card` containing one row per method, reusing the app's existing `Card`/`CardHeader`/`CardTitle`/`CardContent` primitives (already adopted in the recent Settings-vs-Wallet-Settings styling pass) rather than introducing new layout primitives. Only the methods actually supported by this app's `auth.ts` are in scope: **Email**, **Password**, **Google**. GitHub's "Passkeys" and "Apple" rows, and the entire "Two-factor authentication" section below the fold, describe capabilities (passkeys, 2FA, Apple sign-in, security keys, recovery codes) that do not exist in this codebase's better-auth config — cloning those rows would fabricate features. General data flow: `authClient.getSession()` (existing) for the Email row description; a new `authClient.listAccounts()`-backed query for the Google row's connected/disconnected state; existing `authClient.changePassword` flow (already implemented) unchanged for the Password row's action, just re-skinned into the new row layout.

#### Key Design Decisions

- **Scope to methods this app actually supports (Email, Password, Google) vs. mirroring GitHub's full row set** → Trade-off: less visually rich than the reference screenshots (no Passkeys/Apple/2FA rows) vs. accuracy — showing an "Add passkey" or "Connect" (Apple) button with no backing implementation would be a broken affordance. **Recommendation**: build only the three real rows now; treat 2FA/passkeys as a distinct, separately-scoped future requirement, not an extension of this one.
- **How deep to wire the Google row** → Options: (a) static "Connected" label with no interactive Connect/Disconnect (visual-only), vs. (b) fully wire `listAccounts`/`linkSocial`/`unlinkAccount` so the button is live. Trade-off: (a) ships fast but the button is decorative and will read as broken once clicked; (b) matches GitHub's real behavior and the user's ask to "clone" the page, but touches new better-auth client APIs, needs a new icon (Google logo — not brand-colored in the existing monochrome Phosphor icon set, so likely a custom inline SVG), and needs unlink-safety guarding (see business rule above). **Recommendation**: fully wire it (option b) — the user explicitly described their own account as using both Google and Email/Password, implying they want to see and manage that real linkage, not a mock.
- **Email row action ("Manage")** → GitHub's "Manage" opens a whole email-management sub-page (multiple emails, primary email, visibility settings) that has no equivalent here. **Recommendation**: scope the Email row to a read-only display of the account's email + verified-state badge, with no "Manage" action (or a disabled/no-op affordance), since there's no multi-email management capability to link to — avoid promising a page that doesn't exist.
- **Icon sourcing for Google's logo** → Phosphor's icon set is monochrome/generic; GitHub's row uses Google's real multicolor "G" mark. **Recommendation**: add a small custom inline SVG component for the Google brand mark (kept in `packages/ui`, not the Phosphor-icon-name registry) rather than forcing a generic icon into the Google row, since a generic circle/lock icon would undercut the "clone GitHub" intent. Email/Password rows can use new Phosphor icons (envelope, key) added to the existing `IconName` registry.

#### Alternatives Considered

- **Full clone including Two-Factor Authentication section**: rejected — this app's better-auth config has no 2FA/TOTP plugin enabled at all; building that UI now would be speculative and disconnected from any backend capability.
- **Keep the flat "Change password" form as-is, only add visual row chrome around it**: rejected as insufficient — it wouldn't address the user's core ask, which is specifically about surfacing sign-in _methods_ (email, password, Google) as a list, not just re-skinning the password form.

## Risk & Gap Analysis

#### Requirement Ambiguities

- "Clone the Password and Authentication from GitHub" is stated at the page level, but the two attached screenshots include content (Passkeys, Apple, full 2FA section with SMS/Security keys/GitHub Mobile/Recovery codes) that has zero backing capability in this app. Needs confirmation: is the intent (a) visual pattern only (row-with-icon-title-description-action list styling) applied to the methods that exist, or (b) a request to also build out passkeys/2FA/Apple as new auth capabilities? This analysis assumes (a).
- GitHub's "Manage" action for Email implies multi-email support (2 verified emails). Confirm whether this app's single-email model should just show one row with the account's email, or whether multi-email support is an unstated deeper ask.

#### Edge Cases

- **User has no password credential** (hypothetically signed up via Google only, if that flow exists): the Password row's "Change password" action would fail — needs either a "Set password" alternate action or the row hidden/disabled until better-auth's `setPassword` flow (if available) is used.
- **Disconnecting Google when it's the only sign-in method**: must be prevented client-side (and ideally guarded server-side) to avoid account lockout.
- **Email not verified**: better-auth's `user.emailVerified` may be `false` since no verification plugin/flow is currently enabled in `auth.ts` — the row's status text needs a fallback for "unverified" or "verification status unavailable" rather than assuming always-verified.
- **`listAccounts()` failure or slow load**: the Google row needs a pending/error state, not just success/connected/disconnected.

#### Technical Risks

- **No existing query/hook for linked accounts** (`queries/user-settings/` only covers locale) — this requires a new query module (e.g., `queries/auth/` or extending `user-settings`) wrapping `authClient.listAccounts()`, following the existing TanStack Query conventions used elsewhere in the app.
- **No connect/unlink flow implemented anywhere in the app** — `authClient.linkSocial()` / `unlinkAccount()` are unused; this is net-new integration surface with better-auth's client, including OAuth-redirect handling for the "Connect" action (linking mid-session typically redirects through Google's consent screen and back).
- **Icon registry is a curated allowlist** — adding Google's brand mark isn't a simple Phosphor import; it needs a custom SVG component, which is a small but real deviation from the existing `IconName`-only icon usage pattern across the app.
- **Unlink-safety check requires knowing all currently-valid sign-in methods** (password set? other providers linked?) at the moment of disconnecting Google — this cross-cuts the Password row's state and the Google row's state, so the two rows aren't fully independent components as GitHub's UI implies (in GitHub, this is handled server-side across many more methods).

#### Acceptance Criteria Coverage

No formal acceptance criteria were provided — the requirement is a screenshot-driven visual/behavioral clone request. Inferred criteria and coverage assessment:

| AC# | Description                                                                                             | Addressable? | Gaps/Notes                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Account page shows a "Sign in methods" card with one row per supported method (Email, Password, Google) | Yes          | Straightforward with existing `Card` primitives                                                                                                             |
| 2   | Each row shows an icon, title, status description, and action button matching GitHub's visual pattern   | Partial      | Google's brand-colored icon needs a new custom SVG, not just a Phosphor icon addition                                                                       |
| 3   | Password row's "Change password" action continues to work as today                                      | Yes          | Already implemented; just needs re-skinning into the row layout                                                                                             |
| 4   | Email row reflects the account's real email/verification state                                          | Partial      | Single-email model only; no verification plugin currently enabled, so "verified" state may not be meaningful yet                                            |
| 5   | Google row reflects real connection state and supports Connect/Disconnect                               | Partial      | Requires entirely new query + mutation wiring against better-auth client APIs that are currently unused in this codebase; also needs unlink-safety guarding |
| 6   | Passkeys, Apple, Two-factor authentication section                                                      | No           | No backend capability exists for any of these in `auth.ts`; explicitly out of scope per Strategic Approach unless the user confirms otherwise               |
