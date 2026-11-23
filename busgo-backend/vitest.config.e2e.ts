import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // All e2e files share one real database, so run them one at a time:
    // in parallel they would change each other's data (e.g. dashboard totals).
    fileParallelism: false,
  },
});
