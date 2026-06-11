import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

vi.mock('../lib/prisma', () => {
  const txMock = {
    user: { create: vi.fn() },
    therapistPatient: { create: vi.fn() },
    invitation: { update: vi.fn() },
  };
  return {
    prisma: {
      invitation: { findUnique: vi.fn() },
      user: { findUnique: vi.fn(), create: vi.fn() },
      $transaction: vi.fn(async (fn: any) => fn(txMock)),
      _txMock: txMock,
    },
  };
});

import { prisma } from '../lib/prisma';
import { register } from '../modules/auth/auth.service';

const txMock = (prisma as any)._txMock;

describe('Feature: coterapeuta-app, Property 7: Registro con invitación vincula correctamente al paciente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset txMock functions
    txMock.user.create.mockReset();
    txMock.therapistPatient.create.mockReset();
    txMock.invitation.update.mockReset();
  });

  it('creates patient with correct role and TherapistPatient link', async () => {
    /**
     * Validates: Requirements 2.2
     *
     * Property: For any valid invitation code (not used, not expired) issued by therapist T,
     * when registering with that code, the created account must have role `patient`
     * and be linked to therapist T in `therapistPatient`.
     */
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          fullName: fc.string({ minLength: 1, maxLength: 80 }),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 64 }),
          therapistId: fc.uuid(),
          invitationId: fc.uuid(),
          invitationCode: fc.uuid(),
        }),
        async ({ fullName, email, password, therapistId, invitationId, invitationCode }) => {
          const patientId = 'patient-' + Math.random();

          // Mock: valid unused invitation
          vi.mocked(prisma.invitation.findUnique).mockResolvedValueOnce({
            id: invitationId,
            code: invitationCode,
            therapistId,
            usedAt: null,
            expiresAt: new Date(Date.now() + 72 * 3600 * 1000),
            createdAt: new Date(),
          } as any);

          // Mock: no existing user
          vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

          // Mock transaction: user.create returns patient user
          txMock.user.create.mockImplementationOnce(async ({ data }: any) => ({
            id: patientId,
            fullName: data.fullName,
            email: data.email,
            passwordHash: data.passwordHash,
            role: data.role,
            createdAt: new Date(),
          }));
          txMock.therapistPatient.create.mockResolvedValueOnce({});
          txMock.invitation.update.mockResolvedValueOnce({});

          const result = await register({
            fullName,
            email,
            password,
            role: 'patient',
            invitationCode,
          });

          // Role must be patient
          expect(result.user.role).toBe('patient');

          // TherapistPatient.create must be called with correct IDs
          expect(txMock.therapistPatient.create).toHaveBeenCalledWith({
            data: { therapistId, patientId },
          });

          // Invitation must be stamped usedAt
          expect(txMock.invitation.update).toHaveBeenCalledWith({
            where: { id: invitationId },
            data: { usedAt: expect.any(Date) },
          });

          // User created with role patient
          const userCreateCall = txMock.user.create.mock.calls[txMock.user.create.mock.calls.length - 1][0] as any;
          expect(userCreateCall.data.role).toBe('patient');
        }
      ),
      { numRuns: 20 } // bcrypt cost 12 — slow
    );
  }, 120_000);
});
