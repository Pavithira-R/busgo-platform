/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            // Libraries every page uses, in their own file: they change less
            // often than our code, so browsers keep them cached between updates.
            {
              name: 'vendor',
              test: /node_modules[\\/](react|react-dom|scheduler|react-router|@tanstack|i18next|react-i18next|zod|react-hook-form|@hookform)[\\/]/,
            },
          ],
        },
      },
    },
  },
  server: {
    // Forward /api calls to the NestJS backend during development.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Long user flows (typing a whole booking) need time on slower laptops.
    testTimeout: 15_000,
  },
});
