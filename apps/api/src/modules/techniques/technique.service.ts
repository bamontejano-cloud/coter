import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/errors';
import type { TechniqueBodyType } from './technique.schema';

export async function createTechnique(therapistId: string, body: TechniqueBodyType) {
  const technique = await prisma.technique.create({
    data: {
      therapistId,
      title: body.title,
      description: body.description,
      category: body.category,
      patientInstructions: body.patientInstructions,
    },
  });
  return technique;
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
  const existing = await prisma.technique.findUnique({ where: { id: techniqueId } });
  if (!existing || existing.deletedAt) {
    throw new AppError(404, 'not_found', 'Recurso no encontrado');
  }
  if (existing.therapistId !== therapistId) {
    throw new AppError(403, 'forbidden', 'Acceso denegado');
  }

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
  const existing = await prisma.technique.findUnique({ where: { id: techniqueId } });
  if (!existing || existing.deletedAt) {
    throw new AppError(404, 'not_found', 'Recurso no encontrado');
  }
  if (existing.therapistId !== therapistId) {
    throw new AppError(403, 'forbidden', 'Acceso denegado');
  }

  await prisma.technique.update({
    where: { id: techniqueId },
    data: { deletedAt: new Date() },
  });
}
