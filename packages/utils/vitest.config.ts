import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    name: 'utils',
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/index.ts', 'src/**/types.ts', 'src/**/constants.ts'],
    },
  },
});
