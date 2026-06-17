import { prisma } from '../../lib/prisma';
import { Errors } from '../../lib/errors';
import type { TechniqueBodyType } from './technique.schema';

async function findOwnedOr404(therapistId: string, techniqueId: string) {
  const technique = await prisma.technique.findUnique({ where: { id: techniqueId } });
  if (!technique || technique.deletedAt) throw Errors.notFound();
  if (technique.therapistId !== therapistId) throw Errors.forbidden();
  return technique;
}

export async function createTechnique(therapistId: string, body: TechniqueBodyType) {
  return prisma.technique.create({
    data: {
      therapistId,
      title: body.title,
      description: body.description,
      category: body.category,
      patientInstructions: body.patientInstructions,
    },
  });
}

export async function listTechniques(therapistId: string, category?: string) {
  return prisma.technique.findMany({
    where: {
      therapistId,
      deletedAt: null,
      ...(category ? { category } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateTechnique(
  therapistId: string,
  techniqueId: string,
  body: TechniqueBodyType,
) {
  await findOwnedOr404(therapistId, techniqueId);
  return prisma.technique.update({
    where: { id: techniqueId },
    data: {
      title: body.title,
      description: body.description,
      category: body.category,
      patientInstructions: body.patientInstructions,
    },
  });
}

export async function deleteTechnique(therapistId: string, techniqueId: string) {
  await findOwnedOr404(therapistId, techniqueId);
  await prisma.technique.update({
    where: { id: techniqueId },
    data: { deletedAt: new Date() },
  });
}
