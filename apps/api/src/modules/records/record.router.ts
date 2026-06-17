import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { validateBody } from '../../middleware/validateBody';
import { ah } from '../../lib/asyncHandler';
import { currentUser } from '../../lib/currentUser';
import { RecordBody } from './record.schema';
import { submitRecord, getRecord } from './record.service';

export const recordRouter = Router();

// POST /records — patient only
recordRouter.post(
  '/',
  authenticate,
  requireRole('patient'),
  validateBody(RecordBody),
  ah(async (req, res) => {
    const record = await submitRecord(currentUser(req).sub, req.body);
    res.status(201).json(record);
  }),
);

// GET /records/:assignmentId — both roles
recordRouter.get(
  '/:assignmentId',
  authenticate,
  ah(async (req, res) => {
    const user = currentUser(req);
    const record = await getRecord(user.sub, user.role, req.params.assignmentId);
    res.json(record);
  }),
);
