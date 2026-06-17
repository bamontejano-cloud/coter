import { prisma } from '../../lib/prisma';
import { Errors } from '../../lib/errors';

export async function listPatients(therapistId: string) {
  const links = await prisma.therapistPatient.findMany({
    where: { therapistId },
    include: {
      patient: {
        select: { id: true, fullName: true, email: true },
      },
    },
    orderBy: { linkedAt: 'desc' },
  });

  return links.map((link) => ({
    id: link.patient.id,
    fullName: link.patient.fullName,
    email: link.patient.email,
    linkedAt: link.linkedAt.toISOString(),
  }));
}

export async function getPatientProfile(therapistId: string, patientId: string) {
  // Access check first: a therapist without a link must never reach the
  // assignments or conversation queries (security + side-channel contract).
  const link = await prisma.therapistPatient.findUnique({
    where: { therapistId_patientId: { therapistId, patientId } },
    include: { patient: { select: { id: true, fullName: true, email: true } } },
  });
  if (!link) throw Errors.forbidden();

  const [assignments, conversation] = await Promise.all([
    prisma.assignment.findMany({
      where: { patientId, therapistId },
      select: {
        id: true,
        techniqueId: true,
        technique: { select: { title: true } },
        status: true,
        assignedAt: true,
        therapistNotes: true,
      },
      orderBy: { assignedAt: 'desc' },
    }),
    prisma.conversation.findUnique({
      where: { therapistId_patientId: { therapistId, patientId } },
      include: {
        _count: {
          select: {
            messages: { where: { read: false, receiverId: therapistId } },
          },
        },
      },
    }),
  ]);

  return {
    id: link.patient.id,
    fullName: link.patient.fullName,
    email: link.patient.email,
    linkedAt: link.linkedAt.toISOString(),
    assignments: assignments.map((a) => ({
      id: a.id,
      techniqueId: a.techniqueId,
      techniqueTitle: a.technique.title,
      status: a.status,
      assignedAt: a.assignedAt.toISOString(),
      therapistNotes: a.therapistNotes ?? undefined,
    })),
    messagesSummary: {
      unreadCount: conversation?._count.messages ?? 0,
    },
  };
}
