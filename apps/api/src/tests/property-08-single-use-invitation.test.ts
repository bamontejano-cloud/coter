import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

vi.mock('../lib/prisma', () => ({
  prisma: {
    invitation: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '../lib/prisma';
import { useInvitation } from '../modules/invitations/invitation.service';
import { AppError } from '../lib/errors';

/**
 * Property 8: Invitación de un solo uso
 * Validates: Requirements 2.3
 *
 * For any invitation code that has already been used for a successful
 * registration, any subsequent attempt to use the same code must be
 * rejected with the invalid invitation message.
 */
describe('Feature: coterapeuta-app, Property 8: Invitación de un solo uso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects already-used invitation with AppError 400', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // invitation code
        async (code) => {
          // Simulate an already-used invitation
          vi.mocked(prisma.invitation.findUnique).mockResolvedValueOnce({
            id: 'inv-id',
            code,
            therapistId: 'therapist-id',
            usedAt: new Date(Date.now() - 3600 * 1000), // used 1 hour ago
            expiresAt: new Date(Date.now() + 72 * 3600 * 1000),
            createdAt: new Date(),
          } as any);

          let thrown: unknown;
          try {
            await useInvitation(code);
          } catch (err) {
            thrown = err;
          }

          expect(thrown).toBeInstanceOf(AppError);
          const appErr = thrown as AppError;
          expect(appErr.status).toBe(400);
          expect(appErr.code).toBe('invalid_invitation');
          expect(appErr.message).toBe('La invitación no es válida o ha expirado');

          // update should NOT be called for already-used invitation
          expect(prisma.invitation.update).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects expired invitation with AppError 400', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (code) => {
          vi.mocked(prisma.invitation.findUnique).mockResolvedValueOnce({
            id: 'inv-id',
            code,
            therapistId: 'therapist-id',
            usedAt: null,
            expiresAt: new Date(Date.now() - 3600 * 1000), // expired 1 hour ago
            createdAt: new Date(),
          } as any);

          let thrown: unknown;
          try {
            await useInvitation(code);
          } catch (err) {
            thrown = err;
          }

          expect(thrown).toBeInstanceOf(AppError);
          const appErr = thrown as AppError;
          expect(appErr.status).toBe(400);
          expect(appErr.code).toBe('invalid_invitation');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects non-existent invitation code with AppError 400', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (code) => {
          vi.mocked(prisma.invitation.findUnique).mockResolvedValueOnce(null);

          let thrown: unknown;
          try {
            await useInvitation(code);
          } catch (err) {
            thrown = err;
          }

          expect(thrown).toBeInstanceOf(AppError);
          const appErr = thrown as AppError;
          expect(appErr.status).toBe(400);
        }
      ),
      { numRuns: 50 }
    );
  });
});
