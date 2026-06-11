import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

vi.mock('../lib/prisma', () => ({
  prisma: {
    therapistPatient: { findUnique: vi.fn() },
    assignment: { findMany: vi.fn() },
  },
}));

import { prisma } from '../lib/prisma';
import { listAssignments } from '../modules/assignments/assignment.service';

/**
 * Validates: Requirements 4.2
 *
 * Property 16: Aislamiento de asignaciones del paciente
 * For any patient P, GET /assignments must return only P's assignments,
 * never another patient's, ordered by assignedAt DESC.
 */
describe('Feature: coterapeuta-app, Property 16: Aislamiento de asignaciones del paciente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('patient sees only their own assignments ordered by assignedAt desc', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          patientId: fc.uuid(),
          assignmentCount: fc.integer({ min: 0, max: 10 }),
        }),
        async ({ patientId, assignmentCount }) => {
          const mockAssignments = Array.from({ length: assignmentCount }, (_, i) => ({
            id: `assign-${i}`,
            patientId,
            techniqueId: `tech-${i}`,
            therapistId: `therapist-${i}`,
            status: 'pending',
            assignedAt: new Date(Date.now() - i * 1000),
            technique: { title: `Técnica ${i}` },
          }));

          vi.mocked(prisma.assignment.findMany).mockResolvedValueOnce(mockAssignments as any);

          const result = await listAssignments(patientId, 'patient');

          expect(result).toHaveLength(assignmentCount);

          // All returned assignments belong to this patient
          for (const a of result) {
            expect(a.patientId).toBe(patientId);
          }

          // Verify the query filters by patientId
          const call = vi.mocked(prisma.assignment.findMany).mock.calls[
            vi.mocked(prisma.assignment.findMany).mock.calls.length - 1
          ][0] as any;
          expect(call.where.patientId).toBe(patientId);
          expect(call.orderBy).toEqual({ assignedAt: 'desc' });
        }
      ),
      { numRuns: 100 }
    );
  });
});
