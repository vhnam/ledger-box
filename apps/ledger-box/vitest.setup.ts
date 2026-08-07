import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(dirname, '../..');

/** Prefer `.env` (docs / AGENTS.md); fall back to `.env.dev` used by `pnpm dev`. */
const envCandidates = [path.join(rootDir, '.env'), path.join(rootDir, '.env.dev')];

function loadEnvFile(envPath: string): boolean {
  try {
    const contents = readFileSync(envPath, 'utf-8');

    for (const line of contents.split('\n')) {
      const trimmed = line.trim();

      if (trimmed.length === 0 || trimmed.startsWith('#')) {
        continue;
      }

      const separatorIndex = trimmed.indexOf('=');

      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }

    return true;
  } catch {
    return false;
  }
}

for (const envPath of envCandidates) {
  if (loadEnvFile(envPath)) {
    break;
  }
}
