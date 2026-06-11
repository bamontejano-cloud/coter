import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

vi.mock('../lib/prisma', () => ({
  prisma: {
    assignment: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '../lib/prisma';
import { submitRecord } from '../modules/records/record.service';
import { AppError } from '../lib/errors';

/**
 * Property 20: Inmutabilidad de registros ya enviados
 * Validates: Requirements 5.6
 */
describe('Feature: coterapeuta-app, Property 20: Inmutabilidad de registros ya enviados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects submitRecord for already-completed assignment with 422', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          patientId: fc.uuid(),
          assignmentId: fc.uuid(),
          response: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        }),
        async ({ patientId, assignmentId, response }) => {
          // Assignment already completed
          vi.mocked(prisma.assignment.findUnique).mockResolvedValueOnce({
            id: assignmentId,
            patientId,
            therapistId: 'therapist-id',
            status: 'completed', // already done
            record: { id: 'rec-id' },
          } as any);

          let thrown: unknown;
          try {
            await submitRecord(patientId, { assignmentId, response });
          } catch (err) {
            thrown = err;
          }

          expect(thrown).toBeInstanceOf(AppError);
          const appErr = thrown as AppError;
          expect(appErr.status).toBe(422);

          // Transaction should NOT be called for completed assignments
          expect(prisma.$transaction).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});
