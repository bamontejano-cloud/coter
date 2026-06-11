import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import { signToken } from '../../lib/jwt';
import { AppError } from '../../lib/errors';
import type { RegisterBodyType, LoginBodyType } from './auth.schema';

const BCRYPT_COST = 12;

export async function register(body: RegisterBodyType) {
  const { fullName, email, password } = body;
  let { role } = body;
  const { invitationCode } = body;

  // Validate invitation if provided
  let validatedInvitation: { id: string; therapistId: string } | null = null;
  if (invitationCode) {
    const invitation = await prisma.invitation.findUnique({ where: { code: invitationCode } });
    if (!invitation || invitation.usedAt || invitation.expiresAt < new Date()) {
      throw new AppError(400, 'invalid_invitation', 'La invitación no es válida o ha expirado');
    }
    validatedInvitation = { id: invitation.id, therapistId: invitation.therapistId };
    role = 'patient';
  }

  // Check email uniqueness
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'email_already_exists', 'El correo electrónico ya está registrado');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  if (validatedInvitation) {
    const inv = validatedInvitation;
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { fullName, email, passwordHash, role: 'patient' },
      });
      await tx.therapistPatient.create({
        data: { therapistId: inv.therapistId, patientId: user.id },
      });
      await tx.invitation.update({
        where: { id: inv.id },
        data: { usedAt: new Date() },
      });
      return user;
    });

    const token = signToken({ sub: result.id, role: result.role, email: result.email });
    return {
      user: { id: result.id, fullName: result.fullName, email: result.email, role: result.role },
      token,
    };
  }

  // Standard registration (therapist)
  const user = await prisma.user.create({
    data: { fullName, email, passwordHash, role },
  });
  const token = signToken({ sub: user.id, role: user.role, email: user.email });
  return {
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
    token,
  };
}

export async function login(body: LoginBodyType) {
  const { email, password } = body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, 'invalid_credentials', 'Credenciales inválidas');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'invalid_credentials', 'Credenciales inválidas');
  }

  const token = signToken({ sub: user.id, role: user.role, email: user.email });
  return {
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
    token,
  };
}
