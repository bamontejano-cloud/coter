import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

vi.mock('../lib/prisma', () => ({
  prisma: {
    therapistPatient: { findUnique: vi.fn() },
    assignment: { findMany: vi.fn() },
    conversation: { findUnique: vi.fn() },
  },
}));

import { prisma } from '../lib/prisma';
import { getPatientProfile } from '../modules/patients/patient.service';
import { AppError } from '../lib/errors';

describe('Feature: coterapeuta-app, Property 10: Aislamiento cross-therapist — acceso denegado a pacientes ajenos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('denies access to unlinked patient profile with AppError 403', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // therapistId (T1)
        fc.uuid(), // patientId (P not linked to T1)
        async (therapistId, patientId) => {
          // Simulate no link between T1 and P
          vi.mocked(prisma.therapistPatient.findUnique).mockResolvedValueOnce(null);

          let thrown: unknown;
          try {
            await getPatientProfile(therapistId, patientId);
          } catch (err) {
            thrown = err;
          }

          expect(thrown).toBeInstanceOf(AppError);
          const appErr = thrown as AppError;
          expect(appErr.status).toBe(403);
          expect(appErr.code).toBe('forbidden');
          expect(appErr.message).toBe('Acceso denegado');

          // Should not query assignments or messages when access is denied
          expect(prisma.assignment.findMany).not.toHaveBeenCalled();
          expect(prisma.conversation.findUnique).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});
