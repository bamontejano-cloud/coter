import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

vi.mock('../lib/prisma', () => ({
  prisma: {
    conversation: { findUnique: vi.fn() },
    message: { updateMany: vi.fn(), findMany: vi.fn() },
  },
}));

import { prisma } from '../lib/prisma';
import { getMessages } from '../modules/messages/message.service';
import { AppError } from '../lib/errors';

describe('Feature: coterapeuta-app, Property 25: Aislamiento de conversaciones', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('denies access to non-participant user with 403', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          therapistId: fc.uuid(),
          patientId: fc.uuid(),
          outsiderId: fc.uuid(),
          conversationId: fc.uuid(),
        }).filter(({ therapistId, patientId, outsiderId }) =>
          outsiderId !== therapistId && outsiderId !== patientId
        ),
        async ({ therapistId, patientId, outsiderId, conversationId }) => {
          vi.mocked(prisma.conversation.findUnique).mockResolvedValueOnce({
            id: conversationId, therapistId, patientId, createdAt: new Date(),
          } as any);

          let thrown: unknown;
          try { await getMessages(outsiderId, conversationId); } catch (err) { thrown = err; }

          expect(thrown).toBeInstanceOf(AppError);
          expect((thrown as AppError).status).toBe(403);
        }
      ),
      { numRuns: 100 }
    );
  });
});
