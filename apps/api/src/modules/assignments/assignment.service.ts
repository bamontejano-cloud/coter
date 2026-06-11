import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/errors';

interface AssignmentBody {
  techniqueId: string;
  patientId: string;
  therapistNotes?: string;
}

export async function createAssignment(therapistId: string, body: AssignmentBody) {
  // Verify technique belongs to therapist and is not deleted
  const technique = await prisma.technique.findUnique({ where: { id: body.techniqueId } });
  if (!technique || technique.deletedAt || technique.therapistId !== therapistId) {
    throw new AppError(403, 'forbidden', 'Acceso denegado');
  }

  // Verify patient is linked to therapist
  const link = await prisma.therapistPatient.findUnique({
    where: { therapistId_patientId: { therapistId, patientId: body.patientId } },
  });
  if (!link) {
    throw new AppError(403, 'forbidden', 'Acceso denegado');
  }

  return prisma.assignment.create({
    data: {
      techniqueId: body.techniqueId,
      patientId: body.patientId,
      therapistId,
      therapistNotes: body.therapistNotes,
      status: 'pending',
    },
    include: {
      technique: { select: { title: true } },
    },
  });
}

export async function listAssignments(
  requesterId: string,
  role: string,
  patientIdFilter?: string,
) {
  if (role === 'therapist') {
    if (!patientIdFilter) throw new AppError(400, 'validation_error', 'patientId es requerido');
    // Verify the patient is linked to this therapist
    const link = await prisma.therapistPatient.findUnique({
      where: { therapistId_patientId: { therapistId: requesterId, patientId: patientIdFilter } },
    });
    if (!link) throw new AppError(403, 'forbidden', 'Acceso denegado');

    return prisma.assignment.findMany({
      where: { patientId: patientIdFilter, therapistId: requesterId },
      include: { technique: { select: { title: true } } },
      orderBy: { assignedAt: 'desc' },
    });
  } else {
    // Patient: only see their own assignments
    return prisma.assignment.findMany({
      where: { patientId: requesterId },
      include: { technique: { select: { title: true } } },
      orderBy: { assignedAt: 'desc' },
    });
  }
}
