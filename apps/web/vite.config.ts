import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    // The notification polling hook uses setInterval; set a long enough
    // timeout that PENDING mutations don't kill the test run, but short
    // enough that 40+ tests complete in a reasonable wall-clock time.
    testTimeout: 20_000,
    hookTimeout: 10_000,
  },
});
