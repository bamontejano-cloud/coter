import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-at-least-32-bytes-long!!';

/**
 * Validates: Requirements 1.2
 */
describe('Feature: coterapeuta-app, Property 1: Registro de usuario y hash de contraseña', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores a bcrypt hash (not plaintext) and returns a verifiable JWT', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          fullName: fc.string({ minLength: 1, maxLength: 80 }),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 64 }),
          role: fc.constantFrom('therapist' as const, 'patient' as const),
        }),
        async (userData) => {
          const userId = 'test-user-id-' + Math.random();

          // Simulate no existing user
          vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

          // Simulate user creation — capture what was passed to create
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (prisma.user.create as any).mockImplementationOnce(async ({ data }: any) => ({
            id: userId,
            fullName: data.fullName,
            email: data.email,
            passwordHash: data.passwordHash,
            role: data.role,
            createdAt: new Date(),
          }));

          const result = await register(userData);

          // The create call should have been made with a hash, not plaintext
          // Use the most recent call (last element) since mocks accumulate across PBT iterations
          const calls = vi.mocked(prisma.user.create).mock.calls;
          const createCall = calls[calls.length - 1][0] as any;
          const storedHash = createCall.data.passwordHash;

          // Hash must differ from plaintext
          expect(storedHash).not.toBe(userData.password);

          // Hash must be a valid bcrypt hash
          const isValidBcrypt = await bcrypt.compare(userData.password, storedHash);
          expect(isValidBcrypt).toBe(true);

          // JWT must be verifiable
          const decoded = jwt.verify(result.token, JWT_SECRET) as jwt.JwtPayload;
          expect(decoded.sub).toBe(userId);
          expect(decoded.email).toBe(userData.email);
          expect(decoded.role).toBe(userData.role);

          // Response must not contain the password hash
          expect(result.user).not.toHaveProperty('passwordHash');
          expect(result.user).not.toHaveProperty('password');
        }
      ),
      { numRuns: 20 } // reduced from 100 because bcrypt cost-12 is intentionally slow
    );
  }, 60_000); // 60 s — bcrypt cost-12 ~500 ms/hash × 20 runs
});
