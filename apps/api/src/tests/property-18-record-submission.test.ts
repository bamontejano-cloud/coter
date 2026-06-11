import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

vi.mock('../lib/prisma', () => {
  const txMock = {
    record: { create: vi.fn() },
    assignment: { update: vi.fn() },
    notification: { create: vi.fn() },
  };
  return {
    prisma: {
      assignment: { findUnique: vi.fn() },
      $transaction: vi.fn(async (fn: any) => fn(txMock)),
      _txMock: txMock,
    },
  };
});

import { prisma } from '../lib/prisma';
import { submitRecord } from '../modules/records/record.service';

const txMock = (prisma as any)._txMock;

describe('Feature: coterapeuta-app, Property 18: Envío de registro actualiza estado y persiste todos los campos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    txMock.record.create.mockReset();
    txMock.assignment.update.mockReset();
    txMock.notification.create.mockReset();
  });

  /**
   * **Validates: Requirements 5.2**
   */
  it('creates record with correct fields and transitions assignment to completed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          patientId: fc.uuid(),
          assignmentId: fc.uuid(),
          therapistId: fc.uuid(),
          response: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        }),
        async ({ patientId, assignmentId, therapistId, response }) => {
          // Pending assignment owned by this patient
          vi.mocked(prisma.assignment.findUnique).mockResolvedValueOnce({
            id: assignmentId,
            patientId,
            therapistId,
            status: 'pending',
            record: null,
          } as any);

          const recordId = 'rec-' + Math.random();
          const submittedAt = new Date();

          txMock.record.create.mockResolvedValueOnce({
            id: recordId,
            assignmentId,
            patientId,
            response,
            submittedAt,
          });
          txMock.assignment.update.mockResolvedValueOnce({});
          txMock.notification.create.mockResolvedValueOnce({});

          const result = await submitRecord(patientId, { assignmentId, response });

          // Record persists all fields
          expect(result.response).toBe(response);
          expect(result.patientId).toBe(patientId);
          expect(result.assignmentId).toBe(assignmentId);
          expect(result.submittedAt).toBeInstanceOf(Date);

          // Assignment must be updated to 'completed'
          const updateCall = txMock.assignment.update.mock.calls[txMock.assignment.update.mock.calls.length - 1][0] as any;
          expect(updateCall.data.status).toBe('completed');
          expect(updateCall.where.id).toBe(assignmentId);

          // Notification created for therapist
          const notifCall = txMock.notification.create.mock.calls[txMock.notification.create.mock.calls.length - 1][0] as any;
          expect(notifCall.data.therapistId).toBe(therapistId);
          expect(notifCall.data.type).toBe('assignment_completed');
          expect(notifCall.data.patientId).toBe(patientId);
          expect(notifCall.data.assignmentId).toBe(assignmentId);
        }
      ),
      { numRuns: 50 }
    );
  });
});
