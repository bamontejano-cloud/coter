import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

vi.mock('../lib/prisma', () => ({
  prisma: {
    technique: { findUnique: vi.fn() },
    therapistPatient: { findUnique: vi.fn() },
    assignment: { create: vi.fn(), findMany: vi.fn() },
  },
}));

import { prisma } from '../lib/prisma';
import { createAssignment, listAssignments } from '../modules/assignments/assignment.service';
import { AppError } from '../lib/errors';

describe('Feature: coterapeuta-app, Property 17: Paciente no puede acceder a técnicas no asignadas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createAssignment rejects when technique does not belong to therapist (403)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          therapistId: fc.uuid(),
          otherTherapistId: fc.uuid(),
          patientId: fc.uuid(),
          techniqueId: fc.uuid(),
        }).filter(({ therapistId, otherTherapistId }) => therapistId !== otherTherapistId),
        async ({ therapistId, otherTherapistId, patientId, techniqueId }) => {
          // Technique belongs to a DIFFERENT therapist
          vi.mocked(prisma.technique.findUnique).mockResolvedValueOnce({
            id: techniqueId,
            therapistId: otherTherapistId,
            deletedAt: null,
          } as any);

          let thrown: unknown;
          try {
            await createAssignment(therapistId, { techniqueId, patientId });
          } catch (err) {
            thrown = err;
          }

          expect(thrown).toBeInstanceOf(AppError);
          expect((thrown as AppError).status).toBe(403);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('patient listAssignments query only includes their patientId filter', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (patientId) => {
          vi.mocked(prisma.assignment.findMany).mockResolvedValueOnce([]);

          await listAssignments(patientId, 'patient');

          const call = vi.mocked(prisma.assignment.findMany).mock.calls[
            vi.mocked(prisma.assignment.findMany).mock.calls.length - 1
          ][0] as any;

          expect(call.where.patientId).toBe(patientId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
