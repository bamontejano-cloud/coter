import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import bcrypt from 'bcrypt';

// Mock prisma before importing service
vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from '../lib/prisma';
import { login } from '../modules/auth/auth.service';
import { AppError } from '../lib/errors';

const BCRYPT_COST = 4; // Use cost 4 for tests (fast but valid)

/**
 * Validates: Requirements 1.5
 */
describe('Feature: coterapeuta-app, Property 4: Rechazo de credenciales incorrectas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects non-matching passwords with AppError 401', async () => {
    // Pre-hash a known password once
    const correctPassword = 'correct-password-123';
    const storedHash = await bcrypt.hash(correctPassword, BCRYPT_COST);

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          // Wrong password: any string that isn't the correct password
          wrongPassword: fc.string({ minLength: 1, maxLength: 64 }).filter(s => s !== correctPassword),
        }),
        async ({ email, wrongPassword }) => {
          vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 'user-id',
            fullName: 'Test User',
            email,
            passwordHash: storedHash,
            role: 'therapist',
            createdAt: new Date(),
          } as any);

          let thrown: unknown;
          try {
            await login({ email, password: wrongPassword });
          } catch (err) {
            thrown = err;
          }

          expect(thrown).toBeInstanceOf(AppError);
          const appErr = thrown as AppError;
          expect(appErr.status).toBe(401);
          expect(appErr.code).toBe('invalid_credentials');
          expect(appErr.message).toBe('Credenciales inválidas');
        }
      ),
      { numRuns: 20 } // reduced because bcrypt compare is slow
    );
  });

  it('rejects login for non-existent email with AppError 401', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 64 }),
        }),
        async ({ email, password }) => {
          vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

          let thrown: unknown;
          try {
            await login({ email, password });
          } catch (err) {
            thrown = err;
          }

          expect(thrown).toBeInstanceOf(AppError);
          const appErr = thrown as AppError;
          expect(appErr.status).toBe(401);
          expect(appErr.code).toBe('invalid_credentials');
        }
      ),
      { numRuns: 50 }
    );
  });
});
