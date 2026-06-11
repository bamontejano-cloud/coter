import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

vi.mock('../lib/prisma', () => ({
  prisma: {
    conversation: { findUnique: vi.fn() },
    message: { create: vi.fn() },
  },
}));

import { prisma } from '../lib/prisma';
import { sendMessage } from '../modules/messages/message.service';

describe('Feature: coterapeuta-app, Property 22: Round-trip de mensaje — persistencia íntegra', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('sendMessage persists content, senderId, receiverId, sentAt', async () => {
    /**
     * Validates: Requirements 6.2
     */
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          therapistId: fc.uuid(),
          patientId: fc.uuid(),
          conversationId: fc.uuid(),
          content: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          senderIsTherapist: fc.boolean(),
        }),
        async ({ therapistId, patientId, conversationId, content, senderIsTherapist }) => {
          const senderId = senderIsTherapist ? therapistId : patientId;
          const receiverId = senderIsTherapist ? patientId : therapistId;

          vi.mocked(prisma.conversation.findUnique).mockResolvedValueOnce({
            id: conversationId, therapistId, patientId, createdAt: new Date(),
          } as any);

          const sentAt = new Date();
          vi.mocked(prisma.message.create).mockResolvedValueOnce({
            id: 'msg-id', conversationId, senderId, receiverId, content, read: false, sentAt,
          } as any);

          const result = await sendMessage(senderId, { conversationId, content });

          expect(result.content).toBe(content);
          expect(result.senderId).toBe(senderId);
          expect(result.receiverId).toBe(receiverId);
          expect(result.sentAt).toBeInstanceOf(Date);

          const createCall = vi.mocked(prisma.message.create).mock.calls[
            vi.mocked(prisma.message.create).mock.calls.length - 1
          ][0] as any;
          expect(createCall.data.content).toBe(content);
          expect(createCall.data.senderId).toBe(senderId);
          expect(createCall.data.receiverId).toBe(receiverId);
          expect(createCall.data.sentAt).toBeInstanceOf(Date);
        }
      ),
      { numRuns: 100 }
    );
  });
});
