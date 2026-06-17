import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { ah } from '../../lib/asyncHandler';
import { currentUser } from '../../lib/currentUser';
import { createInvitation, validateInvitation } from './invitation.service';

export const invitationRouter = Router();

// POST /invitations — therapist only
invitationRouter.post(
  '/',
  authenticate,
  requireRole('therapist'),
  ah(async (req, res) => {
    const result = await createInvitation(currentUser(req).sub);
    res.status(201).json(result);
  }),
);

// GET /invitations/:code/validate — public
invitationRouter.get(
  '/:code/validate',
  ah(async (req, res) => {
    const result = await validateInvitation(req.params.code);
    res.json(result);
  }),
);
