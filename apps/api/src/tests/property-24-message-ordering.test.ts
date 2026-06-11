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

describe('Feature: coterapeuta-app, Property 24: Mensajes ordenados cronológicamente y contador de no leídos', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('getMessages query uses sentAt ASC order', async () => {
    /**
     * Validates: Requirements 6.4, 6.5, 6.6
     */
    await fc.assert(
      fc.asyncProperty(
        fc.record({ userId: fc.uuid(), conversationId: fc.uuid(), msgCount: fc.integer({ min: 0, max: 10 }) }),
        async ({ userId, conversationId, msgCount }) => {
          vi.mocked(prisma.conversation.findUnique).mockResolvedValueOnce({
            id: conversationId, therapistId: userId, patientId: 'patient-id', createdAt: new Date(),
          } as any);

          const now = Date.now();
          const mockMessages = Array.from({ length: msgCount }, (_, i) => ({
            id: `msg-${i}`, content: `msg ${i}`, senderId: 'some-user', receiverId: userId,
            read: false, sentAt: new Date(now + i * 1000), conversationId,
          }));

          vi.mocked(prisma.message.updateMany).mockResolvedValueOnce({ count: msgCount } as any);
          vi.mocked(prisma.message.findMany).mockResolvedValueOnce(mockMessages as any);

          const result = await getMessages(userId, conversationId);

          expect(result).toHaveLength(msgCount);

          // Verify query uses ascending order
          const findCall = vi.mocked(prisma.message.findMany).mock.calls[
            vi.mocked(prisma.message.findMany).mock.calls.length - 1
          ][0] as any;
          expect(findCall.orderBy).toEqual({ sentAt: 'asc' });

          // Verify mark-as-read was called for this receiver
          const updateCall = vi.mocked(prisma.message.updateMany).mock.calls[
            vi.mocked(prisma.message.updateMany).mock.calls.length - 1
          ][0] as any;
          expect(updateCall.where.receiverId).toBe(userId);
          expect(updateCall.where.read).toBe(false);
          expect(updateCall.data.read).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
