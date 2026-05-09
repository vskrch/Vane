import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: [
        'src/lib/config/clientRegistry.ts',
        'src/lib/models/providers/nvidia/index.ts',
        'src/lib/models/providers/openaicompatible/index.ts',
        'src/lib/models/providers/index.ts',
        'src/lib/agents/search/researcher/actions/search/webSearch.ts',
        'src/lib/agents/search/researcher/actions/search/baseSearch.ts',
        'src/lib/agents/search/researcher/actions/plan.ts',
        'src/lib/agents/search/researcher/actions/done.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 100,
        lines: 80,
      },
    },
    globals: true,
  },
});
