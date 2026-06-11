import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

vi.mock('../lib/prisma', () => ({
  prisma: {
    therapistPatient: { findMany: vi.fn() },
  },
}));

import { prisma } from '../lib/prisma';
import { listPatients } from '../modules/patients/patient.service';

/**
 * Validates: Requirements 2.4, 2.6
 *
 * Property 9: Lista de pacientes es completa y contiene solo los vinculados
 *
 * For any therapist with N linked patients, GET /patients must return exactly
 * those N patients, without including patients of other therapists.
 */
describe('Feature: coterapeuta-app, Property 9: Lista de pacientes es completa y contiene solo los vinculados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns exactly the linked patients for a therapist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // therapistId
        fc.array(
          fc.record({
            patientId: fc.uuid(),
            fullName: fc.string({ minLength: 1, maxLength: 80 }),
            email: fc.emailAddress(),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        async (therapistId, linkedPatients) => {
          const mockLinks = linkedPatients.map((p) => ({
            therapistId,
            patientId: p.patientId,
            linkedAt: new Date(),
            patient: { id: p.patientId, fullName: p.fullName, email: p.email },
          }));

          vi.mocked(prisma.therapistPatient.findMany).mockResolvedValueOnce(mockLinks as any);

          const result = await listPatients(therapistId);

          // Exactly N patients returned
          expect(result).toHaveLength(linkedPatients.length);

          // All returned IDs belong to linked patients
          const linkedIds = new Set(linkedPatients.map((p) => p.patientId));
          for (const r of result) {
            expect(linkedIds.has(r.id)).toBe(true);
          }

          // findMany was called with the correct therapistId filter
          const call = vi.mocked(prisma.therapistPatient.findMany).mock.calls[
            vi.mocked(prisma.therapistPatient.findMany).mock.calls.length - 1
          ][0] as any;
          expect(call.where.therapistId).toBe(therapistId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
