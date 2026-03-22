// @ts-nocheck - vitest/config types may not resolve during Next.js build
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.next'],
    server: {
      deps: {
        inline: [/@prisma/, /resend/],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
