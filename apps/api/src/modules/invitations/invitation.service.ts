import { prisma } from '../../lib/prisma';
import { generateInvitationCode } from '../../lib/crypto';
import { AppError } from '../../lib/errors';

const INVITATION_EXPIRY_HOURS = 72;

export async function createInvitation(therapistId: string) {
  const code = generateInvitationCode();
  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000);

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
    throw new AppError(400, 'invalid_invitation', 'La invitación no es válida o ha expirado');
  }

  const updated = await prisma.invitation.update({
    where: { code },
    data: { usedAt: new Date() },
  });

  return updated;
}
