import { prisma } from '../../lib/prisma';
import { generateInvitationCode } from '../../lib/crypto';
import { Errors } from '../../lib/errors';

const INVITATION_EXPIRY_HOURS = 72;

const HOUR_MS = 60 * 60 * 1000;

export async function createInvitation(therapistId: string) {
  const code = generateInvitationCode();
  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_HOURS * HOUR_MS);

  const invitation = await prisma.invitation.create({
    data: { code, therapistId, expiresAt },
  });

  return { code: invitation.code, expiresAt: invitation.expiresAt.toISOString() };
}

export async function validateInvitation(code: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { code },
    include: { therapist: { select: { fullName: true } } },
  });

  if (!invitation || invitation.usedAt || invitation.expiresAt < new Date()) {
    return { valid: false };
  }

  return { valid: true, therapistName: invitation.therapist.fullName };
}

export async function useInvitation(code: string) {
  const invitation = await prisma.invitation.findUnique({ where: { code } });

  if (!invitation || invitation.usedAt || invitation.expiresAt < new Date()) {
    throw Errors.invalidInvitation();
  }

  return prisma.invitation.update({
    where: { code },
    data: { usedAt: new Date() },
  });
}
