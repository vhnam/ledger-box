import { defineConfig } from 'vite-plus';
import type { OxfmtConfig } from 'vite-plus/fmt';

import oxfmtConfig from './.oxfmtrc.json' with { type: 'json' };

export default defineConfig({
  fmt: oxfmtConfig as OxfmtConfig,
  staged: {
    '*': 'vp check --fix',
  },
  lint: {
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    rules: { 'vite-plus/prefer-vite-plus-imports': 'error' },
    options: { typeAware: true, typeCheck: true },
  },
  run: {
    cache: true,
  },
});
