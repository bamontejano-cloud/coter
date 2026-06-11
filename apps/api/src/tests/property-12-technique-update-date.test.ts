import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

vi.mock('../lib/prisma', () => ({
  prisma: {
    technique: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

import { prisma } from '../lib/prisma';
import { updateTechnique } from '../modules/techniques/technique.service';

describe('Feature: coterapeuta-app, Property 12: Actualización de técnica registra fecha de modificación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updatedAt after update is >= createdAt', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          therapistId: fc.uuid(),
          techniqueId: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 120 }),
          description: fc.string({ minLength: 1 }),
          category: fc.string({ minLength: 1 }),
          patientInstructions: fc.option(fc.string(), { nil: undefined }),
        }),
        async ({ therapistId, techniqueId, title, description, category, patientInstructions }) => {
          const createdAt = new Date('2024-01-01T00:00:00Z');
          const updatedAt = new Date(createdAt.getTime() + 1000); // 1 second later

          // Mock existing technique owned by this therapist
          vi.mocked(prisma.technique.findUnique).mockResolvedValueOnce({
            id: techniqueId,
            therapistId,
            title: 'Old Title',
            description: 'Old desc',
            category: 'old',
            patientInstructions: null,
            deletedAt: null,
            createdAt,
            updatedAt: createdAt,
          } as any);

          // Mock update returning new updatedAt
          vi.mocked(prisma.technique.update).mockResolvedValueOnce({
            id: techniqueId,
            therapistId,
            title,
            description,
            category,
            patientInstructions: patientInstructions ?? null,
            deletedAt: null,
            createdAt,
            updatedAt,
          } as any);

          const result = await updateTechnique(therapistId, techniqueId, {
            title,
            description,
            category,
            patientInstructions,
          });

          // updatedAt must be >= createdAt
          expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(result.createdAt.getTime());
          // updatedAt must be strictly after the original createdAt in our mock
          expect(result.updatedAt.getTime()).toBeGreaterThan(createdAt.getTime());
        }
      ),
      { numRuns: 100 }
    );
  });
});
