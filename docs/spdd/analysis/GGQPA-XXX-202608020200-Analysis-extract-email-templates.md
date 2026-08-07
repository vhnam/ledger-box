# SPDD Analysis: Extract Email Templates Out of Netlify Function Handlers

## Original Business Requirement

Extract email templates out of the Netlify function handlers. Read `AGENTS.md` first.

Current state: `netlify/functions/lib/mailer.ts` wraps Resend with a `sendEmail` helper.
Each caller — `wallet-member.mts` and the invite flow — builds HTML and text strings
inline. There is no template system.

## Task

Move each email's content into its own module, so handlers pass data and get back a
rendered subject, HTML, and text.

Decide and justify:

- Where template modules live and how they are named.
- How they are rendered. Plain template literals with typed parameters are acceptable and
  preferred if they cover the need — evaluate whether anything heavier is warranted.
- Whether HTML and plain-text bodies are authored together per template or separately.
- How shared layout (header, footer, wallet branding) is handled without each template
  duplicating it.

## Constraints

- Templates stay in the repository as source files under version control. Do NOT put
  template content in the database, and do NOT build an editor UI or admin CRUD. The goal
  is that changing an email means editing a typed source file and shipping it, reviewable
  in a pull request.
- Template parameters must be typed, so a renamed field fails at type-check rather than
  at send time.
- No behaviour change: the emails that go out after this merge are the same emails, with
  the same content, as before. This is a refactor.
- Add a way to preview a rendered template without sending mail — a Storybook story or a
  script. State which you chose and why.
- Keep `sendEmail` as the single send path; do not scatter Resend calls.
- Write the per-merge changelog and update the root `CHANGELOG.md`.

If you find email content that is currently wrong, inconsistent, or missing a plain-text
alternative, report it separately rather than fixing it in the same merge.

## Domain Concept Identification

### Existing Concepts (from codebase)

- **`sendEmail`** (`netlify/functions/lib/mailer.ts`): the single Resend transport call.
  Accepts `{ to, subject, html, text }`, never throws, returns `{ ok: true } | { ok:
false, error }`. This is already the sole send path — no caller instantiates `Resend`
  directly. It has no knowledge of content and should keep that boundary.
- **`buildInviteEmail`** (`netlify/functions/lib/wallet-invite-email.ts`): **this already
  is a template module**, contrary to the requirement's framing. It takes a typed
  `BuildInviteEmailInput` (`inviterName`, `inviterEmail`, `walletName`, `role`,
  `acceptUrl`) and returns a typed `InviteEmailContent` (`subject`, `html`, `text`) via
  plain template literals — no inline string-building lives in the handlers. It is
  imported by both callers below. There is exactly **one** email in the product today;
  the requirement's claim of multiple inline builders across handlers does not match
  current state (see Risk & Gap Analysis).
- **`wallet-members.mts`** (`POST /api/wallets/:walletId/members`): builds the invite
  token, calls `buildInviteEmail`, then `sendEmail`. Records `invite_email_failed`
  activity on failure.
- **`wallet-member-resend.mts`** (`POST
/api/wallets/:walletId/members/:memberId/resend`): re-issues a token for a pending
  invite, calls the same `buildInviteEmail` + `sendEmail` pair, rate-limited per owner.
- **`wallet-member.mts`** (`PATCH`/`DELETE
/api/wallets/:walletId/members/:memberId`): role change and removal. **Sends no
  email today** — confirmed by grep across the handler directory. The requirement names
  this file as a source of inline email strings; that is not the current state.
- **`WalletMemberRole`** / `WALLET_MEMBER_ROLE_OPTIONS` /
  `WALLET_MEMBER_ROLE_DESCRIPTIONS` (`#/constants/wallet-member-role-options.ts`): the
  role vocabulary (`owner`/`manager`/`viewer`) and their human-readable label/description,
  already consumed by `buildInviteEmail` for the role sentence in the email body.
- **Storybook** (`apps/storybook`): existing preview surface, but scoped by convention
  (per `AGENTS.md`) to `@vhnam/ui` **React presentational components** — every story
  renders a component with `args`. Email templates are plain-string renderers with no
  React component, so this is an existing pattern that doesn't naturally fit the new
  concept without inventing a String-renderer story shape Storybook wasn't built for
  here.

### New Concepts Required

- **A `templates/` module directory** under `netlify/functions/lib/` (naming TBD in
  REASONS Canvas) — a home for one file per email, replacing the single
  `wallet-invite-email.ts` file living directly in `lib/` alongside unrelated helpers
  (`mailer.ts`, `tenant-access.ts`, `wallet-mutations.ts`, `wallet-member-response.ts`).
  This becomes the seam for future emails (e.g., a role-change or removal notice) so they
  don't repeat the current one-off placement.
- **A shared layout/wrapper concept** for HTML (header, footer, wallet branding): does
  not exist yet. Today's single template embeds three bare `<p>` tags with no chrome, so
  there is no existing header/footer to preserve pixel-for-pixel — but the requirement
  asks for a mechanism so a _second_ template won't duplicate whatever chrome is added.
  This is new scaffolding, not an extraction of existing duplication (there is only one
  template to date, so nothing is literally duplicated yet).
- **A preview mechanism** (script or Storybook story) that renders a template's output
  without calling `sendEmail`/Resend — does not exist in any form today.

### Key Business Rules

- **`sendEmail` never throws and is the only Resend call site** — governs `mailer.ts`;
  must remain true after extraction (constraint, not just convention).
- **Email failures are non-fatal to the invite/resend flow** — invite creation and resend
  persist regardless of email outcome; failure is recorded as `invite_email_failed` wallet
  activity, not surfaced as an API error. Governs `wallet-members.mts` and
  `wallet-member-resend.mts`; template extraction must not disturb this control flow.
- **No behavior change** — the rendered subject/html/text bytes for the existing invite
  email must be identical before and after refactor. Governs the new template module and
  any shared-layout wrapper: the wrapper must reproduce the current (minimal, chrome-less)
  output exactly, not "improve" it silently.
- **Content lives in source, not data** — governs where new template modules can be
  read from (filesystem/import only, never a DB table or CMS), consistent with the
  existing `buildInviteEmail` pattern already in the repo.

## Strategic Approach

### Solution Direction

The repository has already solved 80% of this problem: `buildInviteEmail` is a typed,
template-literal-based renderer, decoupled from `sendEmail`, with exactly one call site
pattern (`build*Email(...)` → `sendEmail({...})`) used identically by both handlers that
send mail. The remaining work is **structural, not extractive**:

1. Relocate the single existing template into a dedicated templates location (its own
   directory rather than a peer of unrelated `lib/` helpers), establishing the
   convention future templates will follow.
2. Introduce a shared HTML layout function that the invite template calls into, so header/
   footer/branding has exactly one implementation, even though today only one template
   exists to consume it.
3. Add a preview entry point (script, given Storybook's scope constraint below) that
   imports a template module directly and renders it to inspectable output without
   touching `mailer.ts`/Resend.
4. Leave `wallet-member.mts` untouched for email purposes — it sends none today, and the
   requirement's assumption that it needs extraction does not hold against current code.

Data flow does not change: handler resolves domain data → calls `build<Name>Email(typed
input)` → gets back `{ subject, html, text }` → passes to unchanged `sendEmail`.

### Key Design Decisions

- **Template module location and naming**: a dedicated directory (e.g. sibling to `lib/`
  such as `netlify/functions/lib/email-templates/`, one file per email, named after the
  email's purpose) vs. leaving files flat in `lib/` as today → trade-off is one more
  directory level vs. discoverability as template count grows. **Recommendation**: a
  dedicated directory, because the requirement anticipates more than one template
  eventually (it asks for shared-layout support), and `lib/` already mixes unrelated
  concerns (`tenant-access.ts`, `wallet-mutations.ts`) that would otherwise crowd out
  template files. Exact directory name and file-naming convention (verb-first vs.
  noun-first) is a REASONS Canvas decision.
- **Rendering mechanism**: plain typed template literals (current approach) vs. adopting
  a heavier engine (JSX-based email library, MJML, Handlebars) → trade-off is zero new
  dependencies and full TypeScript narrowing today, versus richer HTML composition tools
  that this repo's one simple, three-paragraph email doesn't need. **Recommendation**:
  keep plain template literals — the existing `buildInviteEmail` already demonstrates
  this scales to typed-parameter safety without new tooling, and there's no multi-column
  layout or conditional-block complexity in the current content that would justify a
  library. Revisit only if a future email needs real HTML layout complexity.
- **HTML/text authored together vs. separately per template**: together in one function
  returning both (current approach) vs. splitting into `*.html.ts` / `*.text.ts` pairs →
  trade-off is co-location (both bodies visible side-by-side, easy to keep the plain-text
  alternative in sync with HTML changes) vs. separation of concerns for larger bodies.
  **Recommendation**: keep them together per template, as today — for single-screen-length
  emails, splitting increases the chance the text body silently drifts from the HTML body
  when only one file gets edited, which directly risks the "missing/inconsistent
  plain-text alternative" failure mode the requirement calls out as a separate class of
  bug.
- **Shared layout mechanism**: a wrapping function (e.g. `renderLayout(bodyHtml) =>
fullHtml`) that each template's HTML calls into, vs. a text-only convention (no HTML
  wrapper) with per-template footers duplicated → trade-off is one shared function to
  maintain vs. every future template repeating boilerplate. **Recommendation**: a small
  layout-wrapping function/module invoked by each template, since the requirement
  explicitly asks for this and a single extraction point today prevents copy-paste drift
  once a second template exists. Must reproduce the current no-chrome look exactly for
  the invite email under the no-behavior-change constraint — i.e., the layout wrapper
  is introduced as a no-op or minimal pass-through for this migration, not a redesign.
- **Preview mechanism — Storybook story vs. standalone script**: **Recommendation:
  script**, not a Storybook story. Storybook in this repo is scoped by `AGENTS.md`
  convention to `@vhnam/ui` React presentational components rendered with `args` — email
  templates are string-returning functions with no React component and no natural
  "component" to instantiate. Forcing them into a story would mean either wrapping HTML
  strings in a dangerouslySetInnerHTML shim component (a fake component built only for
  preview, adding indirection with no reuse) or stretching Storybook's purpose beyond
  its documented scope in this repo. A script that imports a template module, calls it
  with representative fixture data, and writes/opens the rendered HTML (plus prints the
  text body) matches how the repo already handles ad-hoc data scripts
  (`scripts/import-csv.ts`, `scripts/import-bank-csv.ts` pattern) and needs no new
  tooling dependency.

### Alternatives Considered

- **React-Email / JSX-based email components**: rejected — adds a new dependency and
  build step for a single three-paragraph email; the plain-template-literal approach the
  repo already uses is simpler and the requirement explicitly says template literals are
  preferred if sufficient.
- **Storybook story with an HTML-preview wrapper component**: rejected — see rationale
  above; misuses a tool scoped to UI components and would be the only non-component story
  in the app.
- **Splitting `wallet-member.mts` role-change/removal into new emails as part of this
  merge**: rejected — out of scope. The requirement is a refactor of existing template
  storage, not a feature to add new notification emails; `wallet-member.mts` sends none
  today and none should be invented here.

## Risk & Gap Analysis

### Requirement Ambiguities

- **The requirement's premise doesn't match the codebase**: it states `wallet-member.mts`
  and "the invite flow" build HTML/text inline with "no template system." In the actual
  code, there is already exactly one template module (`wallet-invite-email.ts`) used by
  `wallet-members.mts` and `wallet-member-resend.mts`, and `wallet-member.mts` sends no
  email at all. This needs to be surfaced to the requester before REASONS Canvas treats
  this as a large multi-template extraction — the actual scope is: relocate/rename one
  existing template, add a layout seam, add a preview script. Confirm this understanding
  before scoping tasks.
- **Exact naming/location convention** for the new template directory and file names is
  left open by the requirement ("Decide and justify") — this analysis recommends a
  direction but the precise path/name is a REASONS Canvas-level decision.
- **What "shared layout" should visually contain** (header, footer, wallet branding) is
  unspecified beyond the words in the requirement — the current email has no header/
  footer/branding at all, so there's no existing chrome to reverse-engineer. The no-
  behavior-change constraint means this merge cannot introduce new visible chrome; the
  layout wrapper must be introduced as a structural seam with today's content passed
  through unchanged, not as a design change.

### Edge Cases

- **Two call sites, one template**: both `wallet-members.mts` (initial invite) and
  `wallet-member-resend.mts` (resend) call `buildInviteEmail` with slightly different
  surrounding context (new invite vs. re-issued token) — the extraction must confirm both
  call sites keep receiving identical parameter shapes and the rendered output for each
  is unchanged.
- **Missing Resend config** (`RESEND_API_KEY`/`RESEND_EMAIL_FROM_ADDRESS` unset in local
  dev) — `sendEmail` already handles this gracefully (`ok: false` without calling
  Resend); the preview script must not require these env vars, since its entire purpose
  is to render without sending.
- **Role label/description fallback**: `roleLabel` falls back to the raw `role` value if
  not found in `WALLET_MEMBER_ROLE_OPTIONS`; this existing behavior must be preserved
  verbatim in the relocated module.

### Technical Risks

- **Silent content drift during file move**: relocating `wallet-invite-email.ts` risks
  accidental whitespace/formatting changes to the `html`/`text` template literals that
  would violate the no-behavior-change constraint. Mitigation direction: a snapshot/golden
  test asserting exact rendered output (subject/html/text) for fixed input, added before
  or during the move, so any diff is caught at type-check/test time rather than at send
  time — consistent with the requirement's "fails at type-check rather than at send time"
  intent extended to content fidelity.
- **Layout wrapper accidentally changing visible output**: since there is no existing
  header/footer to match, there's a risk of the wrapper adding real markup (even
  whitespace-only wrapping divs) that changes the byte-identical HTML the no-behavior-
  change constraint requires. Mitigation direction: introduce the wrapper as a pass-
  through/no-op for this migration, with follow-up (separate merge) if actual header/
  footer content is wanted.
- **Preview script drifting from real send path**: if the preview script re-implements
  any part of parameter construction (e.g., building its own `acceptUrl`) instead of
  reusing the same typed input shape the handlers use, it can silently pass even after
  the real templates break. Mitigation direction: preview script should import the exact
  same typed input type the handler uses and pass representative fixture values of that
  type, so a renamed field breaks the script at type-check too.

### Acceptance Criteria Coverage

| AC# | Description                                                                                            | Addressable? | Gaps/Notes                                                                                                                                                                                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Move each email's content into its own module; handlers pass data, get back rendered subject/html/text | Yes          | Only one email exists today; "each email" scope is smaller than the requirement implies — flag to requester                                                                                                                                                                                                                                                  |
| 2   | Decide/justify template module location & naming                                                       | Yes          | Recommendation given above; final naming is a REASONS Canvas decision                                                                                                                                                                                                                                                                                        |
| 3   | Decide/justify rendering approach (template literals vs. heavier)                                      | Yes          | Recommend keeping template literals; no gap                                                                                                                                                                                                                                                                                                                  |
| 4   | Decide whether HTML/text authored together or separately                                               | Yes          | Recommend together, matching current file; no gap                                                                                                                                                                                                                                                                                                            |
| 5   | Decide how shared layout is handled without duplication                                                | Partial      | Only one template exists, so there's nothing to de-duplicate yet — the layout seam is being built ahead of need; REASONS Canvas should confirm this speculative scaffolding is still wanted given YAGNI risk                                                                                                                                                 |
| 6   | Templates stay as version-controlled source files, no DB/editor UI                                     | Yes          | Already true of `buildInviteEmail`; extraction preserves this                                                                                                                                                                                                                                                                                                |
| 7   | Typed parameters, renamed field fails at type-check                                                    | Yes          | Already true of `BuildInviteEmailInput`; preserve during relocation                                                                                                                                                                                                                                                                                          |
| 8   | No behavior change                                                                                     | Yes          | Requires care during file move + layout wrapper introduction (see Technical Risks); a golden-output test is recommended                                                                                                                                                                                                                                      |
| 9   | Add preview mechanism (Storybook story or script)                                                      | Yes          | Recommend script, justified above; Storybook scope doesn't fit string-rendering templates                                                                                                                                                                                                                                                                    |
| 10  | Keep `sendEmail` as single send path                                                                   | Yes          | Already true; no caller besides `mailer.ts` imports `resend`                                                                                                                                                                                                                                                                                                 |
| 11  | Write per-merge changelog + update root `CHANGELOG.md`                                                 | Yes          | Follow existing `docs/changelogs/mr-<NN>-<slug>.md` format observed in `mr-17`                                                                                                                                                                                                                                                                               |
| 12  | Report (not fix) any wrong/inconsistent/missing plain-text content found                               | Partial      | No content defects found in the single existing template during this analysis — `buildInviteEmail`'s text body is present and mirrors the HTML body's three paragraphs plus a closing line; nothing to report at this time, but REASONS Canvas/implementation should re-check once the file is relocated in case reformatting reveals prior invisible issues |
