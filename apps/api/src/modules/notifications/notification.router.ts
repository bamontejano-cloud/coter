import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { listNotifications, markAsRead } from './notification.service';

export const notificationRouter = Router();

const auth = [authenticate, requireRole('therapist')];

// GET /notifications — therapist only
notificationRouter.get(
  '/',
  ...auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notifications = await listNotifications(req.user!.sub);
      res.json(notifications);
    } catch (err) {
      next(err);
    }
  }
);

// POST /notifications/:id/read — therapist only
notificationRouter.post(
  '/:id/read',
  ...auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await markAsRead(req.user!.sub, req.params.id);
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  }
);
