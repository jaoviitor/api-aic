import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.{test,spec}.{js,ts}'],
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 1000000
  },
});