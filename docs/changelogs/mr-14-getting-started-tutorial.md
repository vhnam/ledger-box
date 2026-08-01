# MR 14 — Getting Started Tutorial & Docs Tooling

**Branch:** `docs/documentation` → `main`

### Added

#### End-user tutorial

- `docs/tutorials/getting-started-with-ledger-box.md` — Diátaxis tutorial that walks a
  new user through sign-in, creating wallets, recording income/expense, editing and
  deleting transactions, attachments, transfers, member invites, statement share
  links, and the owner activity log

#### Documentation writer skill

- `.agents/skills/documentation-writer/SKILL.md` — Diátaxis documentation-writer
  skill for agents
- `skills-lock.json` — lock entry for the installed skill
- `.claude/skills/documentation-writer` — Claude skill symlink

#### Local env scripts

- `@dotenvx/dotenvx` — load named env files when running Netlify Dev
- `pnpm dev` loads `.env.dev`; new `pnpm dev:prod` loads `.env.prod`
- `.env.example` documents `RESEND_API_KEY`

### Changed

- Root `packageManager` / `devEngines` pnpm pin: `11.12.0` → `11.18.0`
- Root `engines.node`: `>=24` → `>=26`
- Workspace catalog: AWS SDK pins bumped; catalog key ordering normalized

### Setup after merge

```bash
vp install
# Copy/create local env overlays (do not commit secrets):
#   .env.dev   — local Netlify Dev
#   .env.prod  — optional prod-like overlay for `pnpm dev:prod`
# Ensure RESEND_API_KEY is set if your environment uses it.
```

No database migrations.

### Notes

`.env.dev` and `.env.prod` are gitignored — keep real values in local untracked
files only. Commit placeholders via `.env.example` when documenting new variables.

### Commits

- (see `git log` on `docs/documentation` after rewrite; secrets removed from history)
