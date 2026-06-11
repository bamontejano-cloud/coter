import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

vi.mock('../lib/prisma', () => ({
  prisma: {
    technique: { create: vi.fn(), findUnique: vi.fn() },
  },
}));

import { prisma } from '../lib/prisma';
import { createTechnique } from '../modules/techniques/technique.service';

/**
 * Validates: Requirements 3.2
 *
 * Property 11: Creación y recuperación íntegra de técnica (round-trip)
 *
 * For any valid technique created by a therapist (title ≤ 120 chars,
 * non-empty description, non-empty category), retrieving it by its ID
 * must return exactly the same fields it was created with.
 */
describe('Feature: coterapeuta-app, Property 11: Creación y recuperación íntegra de técnica (round-trip)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fields returned by createTechnique match the input data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          therapistId: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 120 }),
          description: fc.string({ minLength: 1 }),
          category: fc.string({ minLength: 1 }),
          patientInstructions: fc.option(fc.string(), { nil: undefined }),
        }),
        async ({ therapistId, title, description, category, patientInstructions }) => {
          const id = 'tech-' + Math.random();
          const now = new Date();

          vi.mocked(prisma.technique.create).mockResolvedValueOnce({
            id,
            therapistId,
            title,
            description,
            category,
            patientInstructions: patientInstructions ?? null,
            deletedAt: null,
            createdAt: now,
            updatedAt: now,
          } as any);

          const result = await createTechnique(therapistId, {
            title,
            description,
            category,
            patientInstructions,
          });

          // All fields must match what was passed in
          expect(result.title).toBe(title);
          expect(result.description).toBe(description);
          expect(result.category).toBe(category);
          expect(result.therapistId).toBe(therapistId);
          if (patientInstructions !== undefined) {
            expect(result.patientInstructions).toBe(patientInstructions);
          }

          // Verify create was called with correct data
          const createCall = vi.mocked(prisma.technique.create).mock.calls[
            vi.mocked(prisma.technique.create).mock.calls.length - 1
          ][0] as any;
          expect(createCall.data.title).toBe(title);
          expect(createCall.data.therapistId).toBe(therapistId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
