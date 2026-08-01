# MR 18 — Extract Email Templates Into Typed, Component-Authored Modules

**Branch:** `refactor/isolate-email-template` → `main`

### Context

`netlify/functions/lib/wallet-invite-email.ts` already held the wallet-invite email as a
typed `buildInviteEmail` function, decoupled from `sendEmail` — but it lived directly in
`lib/` next to unrelated helpers (`mailer.ts`, `tenant-access.ts`), had no shared-layout
seam for future templates, no way to preview a rendered email without sending mail, and
its HTML was hand-assembled template-literal strings with no component reuse.
`wallet-member.mts` (role change/removal) sends no email and needed no changes.

This merge does both: relocates the template into a dedicated, typed module structure,
and converts its content-authoring model from string literals to React components so
editing an email feels like editing a component.

### Evaluated and rejected: `react-email`

Before converting to components, `react-email` (`@react-email/components` +
`@react-email/render`, from Resend, which this project already uses for delivery) was
assessed as the primary option:

- `@react-email/components` (and every split `@react-email/*` component package) is
  marked `deprecated: "Package no longer supported"` on npm. React Email 6.0 folded
  components and rendering into a single `react-email` package; the split packages will
  not be updated further.
- The unified `react-email` package (`6.9.1`) ships `esbuild`, `chokidar`, `socket.io`,
  `tailwindcss`, `commander`, `marked`, `prismjs`, and more as **runtime** dependencies —
  its own local dev-server/CLI toolchain. Importing it into a Netlify Function for its
  JSX primitives would carry that entire dependency graph into the function's production
  bundle for no request-time benefit.
- `@react-email/render` alone is not deprecated and has no React-version conflict with
  this workspace (`react@^19.2.7`), but depends on `prettier`, `html-to-text`, and
  `html5parser`, and its plain-text auto-derivation (`render(el, { plainText: true })`)
  risks drifting from the hand-tuned plain-text body this project needs to keep stable.
- Previewing through the existing Storybook app (`apps/storybook`) was considered and
  rejected: it depends only on `@vhnam/ui`, not `@vhnam/ledger-box`, and per `AGENTS.md`
  business content belongs in the app, not the shared UI package; separately, Storybook's
  Tailwind-compiled-CSS pipeline would preview something structurally different from what
  a mail client (no external stylesheet) actually renders.

**Decision**: plain React function components, inline `style` props (no Tailwind, no
`packages/ui`), rendered with `renderToStaticMarkup` from `react-dom/server` — already
available via the `react`/`react-dom` catalog pins. **No new dependency was added to the
pnpm workspace catalog.**

### Added

- `netlify/functions/lib/email-templates/` — dedicated directory for outbound email
  templates (was a single file directly under `lib/`).
- `netlify/functions/lib/email-templates/email-layout.tsx` — `EmailLayout`, a
  content-free, table-based structural wrapper (max-width container, padding, base font)
  that any template body wraps itself in. No branding content in this merge.
- `netlify/functions/lib/email-templates/wallet-invite-email.tsx` — `WalletInviteEmailBody`,
  a component rendering the invite email's four paragraphs (invite sentence with role,
  role description, accept link, opt-out note) wrapped in `<EmailLayout>`, plus
  `renderWalletInviteEmail(input): EmailContent`, the typed adapter handlers call:
  `subject` and `text` are hand-authored strings; `html` is produced via
  `renderToStaticMarkup(<WalletInviteEmailBody {...input} />)`.
- `netlify/functions/lib/email-templates/wallet-invite-email.test.ts` — golden-output
  test asserting exact `subject`/`html`/`text` for a representative input and for the
  blank-inviter-name fallback path.
- `apps/ledger-box/scripts/preview-email.tsx` (`pnpm --filter @vhnam/ledger-box
preview:email`) — renders `WalletInviteEmailBody` via `renderToStaticMarkup` (the same
  call production code makes), prints subject/text to stdout, and writes the HTML to a
  temp file for manual inspection. No Resend call, no required environment variables.

### Changed

- `wallet-members.mts` and `wallet-member-resend.mts` now import
  `renderWalletInviteEmail` from `./lib/email-templates/wallet-invite-email.tsx`
  (previously `buildInviteEmail` from `./lib/wallet-invite-email.ts`) — no other logic in
  either handler changed.
- Rendered `html` gains a `<table>`-based wrapper with inline styles (max-width, padding,
  font-family, background color) that the previous bare `<p>` tags did not have — this is
  styling that follows from the new shared layout. No wording, links, or paragraph
  content changed; `subject` and `text` are byte-identical to before.

### No changes

- `netlify/functions/lib/mailer.ts` (`sendEmail`) — signature and behavior unchanged; it
  remains the only file that imports `resend`.
- `wallet-member.mts` — sends no email before or after this merge.
- No new dependency in `pnpm-workspace.yaml`'s `catalog:` or any `package.json`.
- No content defects (wrong/inconsistent/missing plain-text alternative) were found in
  the existing template during this refactor.

### Removed

- `netlify/functions/lib/wallet-invite-email.ts` (old location, string-based).

### Setup after merge

```bash
vp install
vp check   # format, lint, type check
vp test    # includes the wallet-invite-email golden-output test
pnpm --filter @vhnam/ledger-box preview:email   # renders the invite email to a temp HTML file
```

No migrations, no new environment variables, no API or route changes.

### Commits

- `2cff7b2` refactor(ledger-box): isolate email template
