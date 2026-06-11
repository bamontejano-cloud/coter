import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

vi.mock('../lib/prisma', () => ({
  prisma: {
    technique: { findUnique: vi.fn() },
    therapistPatient: { findUnique: vi.fn() },
    assignment: { create: vi.fn() },
  },
}));

import { prisma } from '../lib/prisma';
import { createAssignment } from '../modules/assignments/assignment.service';

describe('Feature: coterapeuta-app, Property 15: Asignación creada con estado inicial `pending`', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createAssignment produces status=pending and passes it to prisma', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          therapistId: fc.uuid(),
          patientId: fc.uuid(),
          techniqueId: fc.uuid(),
          therapistNotes: fc.option(fc.string(), { nil: undefined }),
        }),
        async ({ therapistId, patientId, techniqueId, therapistNotes }) => {
          const now = new Date();

          // Mock: technique owned by therapist, not deleted
          vi.mocked(prisma.technique.findUnique).mockResolvedValueOnce({
            id: techniqueId,
            therapistId,
            deletedAt: null,
          } as any);

          // Mock: patient linked to therapist
          vi.mocked(prisma.therapistPatient.findUnique).mockResolvedValueOnce({
            therapistId,
            patientId,
          } as any);

          // Mock: assignment created with pending status
          vi.mocked(prisma.assignment.create).mockResolvedValueOnce({
            id: 'assign-' + Math.random(),
            techniqueId,
            patientId,
            therapistId,
            therapistNotes: therapistNotes ?? null,
            status: 'pending',
            assignedAt: now,
            technique: { title: 'Test Technique' },
          } as any);

          const result = await createAssignment(therapistId, {
            techniqueId,
            patientId,
            therapistNotes,
          });

          // Status must be pending
          expect(result.status).toBe('pending');

          // Verify prisma.assignment.create was called with status: 'pending'
          const createCall = vi.mocked(prisma.assignment.create).mock.calls[
            vi.mocked(prisma.assignment.create).mock.calls.length - 1
          ][0] as any;
          expect(createCall.data.status).toBe('pending');
          expect(createCall.data.therapistId).toBe(therapistId);
          expect(createCall.data.patientId).toBe(patientId);
          expect(createCall.data.techniqueId).toBe(techniqueId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
