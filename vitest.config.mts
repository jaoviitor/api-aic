import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules', 
        'test', 
        'dist',
        'src/index.ts',
        'src/config/**',
        'src/controllers/**',
        'src/routes/**',
        'src/types/**',
      ],
    },
  },
});
