import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite-plus';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    name: 'ledger-box',
    environment: 'node',
    setupFiles: [path.join(dirname, 'vitest.setup.ts')],
    include: ['netlify/functions/**/*.test.ts', 'src/**/*.test.ts'],
  },
});
