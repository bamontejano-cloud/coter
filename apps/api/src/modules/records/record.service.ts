import { prisma } from '../../lib/prisma';
import { Errors } from '../../lib/errors';
import { assertTherapistOwnsPatient } from '../../lib/access';
import type { Role } from '@coterapeuta/shared';
import type { RecordBodyType } from './record.schema';

const ASSIGNMENT_WITH_RECORD = { record: true } as const;

export async function submitRecord(patientId: string, body: RecordBodyType) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: body.assignmentId },
    include: ASSIGNMENT_WITH_RECORD,
  });

  if (!assignment || assignment.patientId !== patientId) {
    throw Errors.forbidden();
  }
  if (assignment.status !== 'pending') {
    throw Errors.validation('Esta asignación ya ha sido completada');
  }

  return prisma.$transaction(async (tx) => {
    const record = await tx.record.create({
      data: {
        assignmentId: body.assignmentId,
        patientId,
        response: body.response,
        submittedAt: new Date(),
      },
    });
    await tx.assignment.update({
      where: { id: body.assignmentId },
      data: { status: 'completed' },
    });
    await tx.notification.create({
      data: {
        therapistId: assignment.therapistId,
        type: 'assignment_completed',
        patientId,
        assignmentId: body.assignmentId,
      },
    });
    return record;
  });
}

export async function getRecord(requesterId: string, requesterRole: Role, assignmentId: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: ASSIGNMENT_WITH_RECORD,
  });

  if (!assignment) throw Errors.notFound();

  if (requesterRole === 'therapist') {
    await assertTherapistOwnsPatient(requesterId, assignment.patientId);
  } else if (assignment.patientId !== requesterId) {
    throw Errors.forbidden();
  }

  if (!assignment.record) throw Errors.notFound();

  return {
    id: assignment.record.id,
    assignmentId: assignment.record.assignmentId,
    response: assignment.record.response,
    submittedAt: assignment.record.submittedAt.toISOString(),
  };
}
