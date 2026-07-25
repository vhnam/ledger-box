import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Plugin } from 'vite';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const srcRoot = path.join(packageRoot, 'src');
const extensions = ['.tsx', '.ts', '.jsx', '.js'];

function isUiPackageFile(importer: string): boolean {
  const normalized = path.normalize(importer.split('?')[0] ?? importer);
  return normalized.includes(`${path.sep}packages${path.sep}ui${path.sep}`) || normalized.includes('@vhnam/ui');
}

function resolveSourceFile(basePath: string): string | null {
  for (const extension of extensions) {
    const filePath = `${basePath}${extension}`;
    if (existsSync(filePath)) {
      return filePath;
    }
  }

  for (const extension of extensions) {
    const filePath = path.join(basePath, `index${extension}`);
    if (existsSync(filePath)) {
      return filePath;
    }
  }

  return null;
}

export function ui(appSrc?: string): Plugin {
  return {
    name: '@vhnam/ui',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!source.startsWith('#/') || !importer) {
        return null;
      }

      const fromUiPackage = isUiPackageFile(importer);
      if (!fromUiPackage && !appSrc) {
        return null;
      }

      return resolveSourceFile(path.join(fromUiPackage ? srcRoot : appSrc!, source.slice(2)));
    },
  };
}
