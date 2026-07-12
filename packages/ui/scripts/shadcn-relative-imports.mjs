import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = join(packageRoot, "src");
const extensions = [".tsx", ".ts", ".jsx", ".js"];

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      files.push(...walk(path));
      continue;
    }
    if (/\.(tsx|ts|jsx|js)$/.test(entry)) {
      files.push(path);
    }
  }
  return files;
}

function resolveAliasTarget(importPath) {
  if (importPath.startsWith("@/") || importPath.startsWith("#/")) {
    return join(srcRoot, importPath.slice(2));
  }
  return null;
}

function resolveModuleFile(target) {
  if (extname(target)) {
    return existsSync(target) ? target : null;
  }

  for (const extension of extensions) {
    const filePath = `${target}${extension}`;
    if (existsSync(filePath)) {
      return filePath;
    }
  }

  for (const extension of extensions) {
    const filePath = join(target, `index${extension}`);
    if (existsSync(filePath)) {
      return filePath;
    }
  }

  return null;
}

function toRelativeImport(fromFile, targetFile) {
  let importPath = relative(dirname(fromFile), targetFile).split("\\").join("/");
  if (!importPath.startsWith(".")) {
    importPath = `./${importPath}`;
  }
  return importPath.replace(/\.(tsx|ts|jsx|js)$/, "");
}

const importPattern = /(?<=from\s+['"])(@\/|#\/)([^'"]+)(?=['"])/g;

for (const file of walk(srcRoot)) {
  const source = readFileSync(file, "utf8");
  let changed = false;

  const updated = source.replace(importPattern, (match, _prefix, subpath) => {
    const target = resolveModuleFile(resolveAliasTarget(`@/${subpath}`));
    if (!target) {
      return match;
    }

    changed = true;
    return toRelativeImport(file, target);
  });

  if (changed) {
    writeFileSync(file, updated);
  }
}
