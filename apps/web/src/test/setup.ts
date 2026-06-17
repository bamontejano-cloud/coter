/**
 * Vitest setup file. Runs before every test file.
 *
 * - Loads @testing-library/jest-dom matchers (toBeInTheDocument, etc.).
 * - Auto-cleans up the DOM after each test so React Testing Library
 *   starts every test from a clean slate.
 * - Resets the zustand auth-store + storage so persisted state from one
 *   test does not leak into the next.
 */
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  localStorage.clear();
});
