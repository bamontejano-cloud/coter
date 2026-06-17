import { prisma } from '../../lib/prisma';
import { Errors } from '../../lib/errors';

export async function listNotifications(therapistId: string) {
  return prisma.notification.findMany({
    where: { therapistId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function markAsRead(therapistId: string, notificationId: string) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification || notification.therapistId !== therapistId) {
    throw Errors.forbidden();
  }
  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}
