import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

vi.mock('../lib/prisma', () => ({
  prisma: {
    conversation: { upsert: vi.fn() },
  },
}));

import { prisma } from '../lib/prisma';
import { getOrCreateConversation } from '../modules/messages/message.service';

describe('Feature: coterapeuta-app, Property 21: Unicidad de conversación por par terapeuta-paciente', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('upserts conversation with unique key [therapistId, patientId]', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({ therapistId: fc.uuid(), patientId: fc.uuid() }),
        async ({ therapistId, patientId }) => {
          const convId = 'conv-' + Math.random();
          vi.mocked(prisma.conversation.upsert).mockResolvedValueOnce({
            id: convId, therapistId, patientId, createdAt: new Date(),
          } as any);

          const result = await getOrCreateConversation(therapistId, patientId);
          expect(result.id).toBe(convId);

          const call = vi.mocked(prisma.conversation.upsert).mock.calls[
            vi.mocked(prisma.conversation.upsert).mock.calls.length - 1
          ][0] as any;
          expect(call.where.therapistId_patientId.therapistId).toBe(therapistId);
          expect(call.where.therapistId_patientId.patientId).toBe(patientId);
          expect(call.create.therapistId).toBe(therapistId);
          expect(call.create.patientId).toBe(patientId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
