import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

const add = spawnSync("shadcn", ["add", ...args], {
  cwd: join(packageRoot, ".."),
  stdio: "inherit",
  shell: true,
});

if (add.status !== 0) {
  process.exit(add.status ?? 1);
}

const fixImports = spawnSync("node", ["scripts/shadcn-relative-imports.mjs"], {
  cwd: join(packageRoot, ".."),
  stdio: "inherit",
});

process.exit(fixImports.status ?? 0);
