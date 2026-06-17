import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { ah } from '../../lib/asyncHandler';
import { currentUser } from '../../lib/currentUser';
import { listNotifications, markAsRead } from './notification.service';

export const notificationRouter = Router();

const therapistOnly = [authenticate, requireRole('therapist')];

// GET /notifications — therapist only
notificationRouter.get(
  '/',
  ...therapistOnly,
  ah(async (req, res) => {
    const notifications = await listNotifications(currentUser(req).sub);
    res.json(notifications);
  }),
);

// POST /notifications/:id/read — therapist only
notificationRouter.post(
  '/:id/read',
  ...therapistOnly,
  ah(async (req, res) => {
    await markAsRead(currentUser(req).sub, req.params.id);
    res.sendStatus(204);
  }),
);
