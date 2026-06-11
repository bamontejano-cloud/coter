import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/errors';
import type { RecordBodyType } from './record.schema';

export async function submitRecord(patientId: string, body: RecordBodyType) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: body.assignmentId },
    include: { record: true },
  });

  if (!assignment || assignment.patientId !== patientId) {
    throw new AppError(403, 'forbidden', 'Acceso denegado');
  }
  if (assignment.status !== 'pending') {
    throw new AppError(422, 'validation_error', 'Esta asignación ya ha sido completada');
  }

  const result = await prisma.$transaction(async (tx) => {
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

  return result;
}

export async function getRecord(requesterId: string, requesterRole: string, assignmentId: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { record: true },
  });

  if (!assignment) {
    throw new AppError(404, 'not_found', 'Recurso no encontrado');
  }

  if (requesterRole === 'therapist') {
    // Therapist must own the patient
    const link = await prisma.therapistPatient.findUnique({
      where: { therapistId_patientId: { therapistId: requesterId, patientId: assignment.patientId } },
    });
    if (!link) {
      throw new AppError(403, 'forbidden', 'Acceso denegado');
    }
  } else {
    // Patient must own the assignment
    if (assignment.patientId !== requesterId) {
      throw new AppError(403, 'forbidden', 'Acceso denegado');
    }
  }

  if (!assignment.record) {
    throw new AppError(404, 'not_found', 'Recurso no encontrado');
  }

  return {
    id: assignment.record.id,
    assignmentId: assignment.record.assignmentId,
    response: assignment.record.response,
    submittedAt: assignment.record.submittedAt.toISOString(),
  };
}
