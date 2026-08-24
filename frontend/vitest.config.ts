import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      exclude: ['src/**/*.d.ts', 'src/main.tsx'],
      thresholds: {
        statements: 75,
        branches: 55,
        functions: 75,
        lines: 80,
      },
    },
  },
});
