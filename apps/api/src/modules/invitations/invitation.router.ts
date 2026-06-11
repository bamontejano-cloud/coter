import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { createInvitation, validateInvitation } from './invitation.service';

export const invitationRouter = Router();

// POST /invitations — therapist only
invitationRouter.post(
  '/',
  authenticate,
  requireRole('therapist'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createInvitation(req.user!.sub);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// GET /invitations/:code/validate — public
invitationRouter.get(
  '/:code/validate',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await validateInvitation(req.params.code);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);
