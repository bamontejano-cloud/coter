import { prisma } from '../../lib/prisma';
import { Errors } from '../../lib/errors';
import { assertTherapistOwnsPatient } from '../../lib/access';
import type { Role } from '@coterapeuta/shared';
import type { AssignmentBodyType } from './assignment.schema';

const TECHNIQUE_SELECT = { title: true } as const;

export async function createAssignment(therapistId: string, body: AssignmentBodyType) {
  const technique = await prisma.technique.findUnique({ where: { id: body.techniqueId } });
  if (!technique || technique.deletedAt || technique.therapistId !== therapistId) {
    throw Errors.forbidden();
  }

  await assertTherapistOwnsPatient(therapistId, body.patientId);

  return prisma.assignment.create({
    data: {
      techniqueId: body.techniqueId,
      patientId: body.patientId,
      therapistId,
      therapistNotes: body.therapistNotes,
      status: 'pending',
    },
    include: { technique: { select: TECHNIQUE_SELECT } },
  });
}

export async function listAssignments(
  requesterId: string,
  role: Role,
  patientIdFilter?: string,
) {
  if (role === 'therapist') {
    if (!patientIdFilter) {
      throw Errors.validation('patientId es requerido');
    }
    await assertTherapistOwnsPatient(requesterId, patientIdFilter);

    return prisma.assignment.findMany({
      where: { patientId: patientIdFilter, therapistId: requesterId },
      include: { technique: { select: TECHNIQUE_SELECT } },
      orderBy: { assignedAt: 'desc' },
    });
  }

  // Patient: only their own assignments
  return prisma.assignment.findMany({
    where: { patientId: requesterId },
    include: { technique: { select: TECHNIQUE_SELECT } },
    orderBy: { assignedAt: 'desc' },
  });
}
