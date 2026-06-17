import { prisma } from '../../lib/prisma';
import { Errors } from '../../lib/errors';
import { requireUserInConversation } from '../../lib/access';
import type { Role } from '@coterapeuta/shared';
import type { MessageBodyType } from './message.schema';

export async function getOrCreateConversation(therapistId: string, patientId: string) {
  return prisma.conversation.upsert({
    where: { therapistId_patientId: { therapistId, patientId } },
    create: { therapistId, patientId },
    update: {},
  });
}

export async function listConversations(userId: string, role: Role) {
  const conversations = await prisma.conversation.findMany({
    where: role === 'therapist' ? { therapistId: userId } : { patientId: userId },
    include: {
      messages: { orderBy: { sentAt: 'desc' }, take: 1 },
      _count: {
        select: { messages: { where: { read: false, receiverId: userId } } },
      },
    },
  });

  return conversations.map((conv) => {
    const lastMsg = conv.messages[0];
    return {
      conversationId: conv.id,
      participantId: role === 'therapist' ? conv.patientId : conv.therapistId,
      unreadCount: conv._count.messages,
      lastMessage: lastMsg
        ? { content: lastMsg.content, sentAt: lastMsg.sentAt.toISOString() }
        : undefined,
    };
  });
}

export async function getMessages(userId: string, conversationId: string) {
  await requireUserInConversation(userId, conversationId);

  await prisma.message.updateMany({
    where: { conversationId, receiverId: userId, read: false },
    data: { read: true },
  });

  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { sentAt: 'asc' },
  });
}

export async function sendMessage(senderId: string, body: MessageBodyType) {
  const conversation = await requireUserInConversation(senderId, body.conversationId);

  const receiverId =
    conversation.therapistId === senderId ? conversation.patientId : conversation.therapistId;

  return prisma.message.create({
    data: {
      conversationId: body.conversationId,
      senderId,
      receiverId,
      content: body.content,
      sentAt: new Date(),
    },
  });
}
