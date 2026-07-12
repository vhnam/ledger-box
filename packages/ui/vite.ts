import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Plugin } from 'vite';

const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src');

export function ui(): Plugin {
  return {
    name: '@vhnam/ui',
    config: () => ({
      resolve: {
        alias: {
          '#': src,
        },
      },
    }),
  };
}
