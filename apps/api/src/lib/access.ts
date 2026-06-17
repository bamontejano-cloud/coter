import { Prisma, PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from './prisma';
import { Errors } from './errors';

type Tx = Prisma.TransactionClient;

/**
 * Asserts the (therapistId, patientId) link exists.
 * Throws a 403 AppError otherwise. Accepts a Prisma transaction client so it
 * works inside `prisma.$transaction(...)`.
 */
export async function assertTherapistOwnsPatient(
  therapistId: string,
  patientId: string,
  db: PrismaClient | Tx = defaultPrisma,
): Promise<void> {
  const link = await db.therapistPatient.findUnique({
    where: { therapistId_patientId: { therapistId, patientId } },
  });
  if (!link) throw Errors.forbidden();
}

/**
 * Ensures `userId` is a participant (therapist or patient) of the given
 * conversation. Returns the conversation so callers can read its participants
 * without an extra query.
 */
export async function requireUserInConversation(
  userId: string,
  conversationId: string,
  db: PrismaClient | Tx = defaultPrisma,
) {
  const conversation = await db.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) throw Errors.notFound();
  if (conversation.therapistId !== userId && conversation.patientId !== userId) {
    throw Errors.forbidden();
  }
  return conversation;
}
