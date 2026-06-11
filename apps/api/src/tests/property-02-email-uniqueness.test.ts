import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

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
import { register } from '../modules/auth/auth.service';
import { AppError } from '../lib/errors';

/**
 * Validates: Requirements 1.3
 */
describe('Feature: coterapeuta-app, Property 2: Unicidad de email — rechazo de duplicados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects duplicate email registration with AppError 409', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          fullName: fc.string({ minLength: 1, maxLength: 80 }),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 64 }),
          role: fc.constantFrom('therapist' as const, 'patient' as const),
        }),
        async (userData) => {
          // Simulate existing user found
          vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
            id: 'existing-id',
            fullName: 'Existing User',
            email: userData.email,
            passwordHash: 'some-hash',
            role: 'therapist',
            createdAt: new Date(),
          } as any);

          let thrown: unknown;
          try {
            await register(userData);
          } catch (err) {
            thrown = err;
          }

          expect(thrown).toBeInstanceOf(AppError);
          const appErr = thrown as AppError;
          expect(appErr.status).toBe(409);
          expect(appErr.code).toBe('email_already_exists');
          expect(appErr.message).toBe('El correo electrónico ya está registrado');

          // prisma.user.create should NOT have been called
          expect(prisma.user.create).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});
