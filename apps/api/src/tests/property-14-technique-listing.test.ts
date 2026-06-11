import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

vi.mock('../lib/prisma', () => ({
  prisma: {
    technique: { findMany: vi.fn() },
  },
}));

import { prisma } from '../lib/prisma';
import { listTechniques } from '../modules/techniques/technique.service';

describe('Feature: coterapeuta-app, Property 14: Listado de técnicas ordenado y filtrado correctamente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('query passes deletedAt:null filter and orderBy createdAt desc', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          therapistId: fc.uuid(),
          category: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
        }),
        async ({ therapistId, category }) => {
          vi.mocked(prisma.technique.findMany).mockResolvedValueOnce([]);

          await listTechniques(therapistId, category);

          const call = vi.mocked(prisma.technique.findMany).mock.calls[
            vi.mocked(prisma.technique.findMany).mock.calls.length - 1
          ][0] as any;

          // Must filter deletedAt null
          expect(call.where.deletedAt).toBeNull();
          // Must filter by therapistId
          expect(call.where.therapistId).toBe(therapistId);
          // Must order by createdAt desc
          expect(call.orderBy).toEqual({ createdAt: 'desc' });

          // If category provided, must filter by it
          if (category !== undefined) {
            expect(call.where.category).toBe(category);
          } else {
            expect(call.where.category).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns only category-matching techniques when filter applied', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          therapistId: fc.uuid(),
          targetCategory: fc.string({ minLength: 1, maxLength: 30 }),
          matchingCount: fc.integer({ min: 0, max: 10 }),
        }),
        async ({ therapistId, targetCategory, matchingCount }) => {
          const matchingTechniques = Array.from({ length: matchingCount }, (_, i) => ({
            id: `tech-${i}`,
            therapistId,
            category: targetCategory,
            deletedAt: null,
            createdAt: new Date(Date.now() - i * 1000),
          }));

          vi.mocked(prisma.technique.findMany).mockResolvedValueOnce(matchingTechniques as any);

          const result = await listTechniques(therapistId, targetCategory);

          expect(result).toHaveLength(matchingCount);
          for (const t of result) {
            expect(t.category).toBe(targetCategory);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
