import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { validateBody } from '../../middleware/validateBody';
import { ah } from '../../lib/asyncHandler';
import { currentUser } from '../../lib/currentUser';
import { AssignmentBody } from './assignment.schema';
import { createAssignment, listAssignments } from './assignment.service';

export const assignmentRouter = Router();

// POST /assignments — therapist only
assignmentRouter.post(
  '/',
  authenticate,
  requireRole('therapist'),
  validateBody(AssignmentBody),
  ah(async (req, res) => {
    const assignment = await createAssignment(currentUser(req).sub, req.body);
    res.status(201).json(assignment);
  }),
);

// GET /assignments — both roles
assignmentRouter.get(
  '/',
  authenticate,
  ah(async (req, res) => {
    const user = currentUser(req);
    const patientIdFilter =
      typeof req.query.patientId === 'string' ? req.query.patientId : undefined;
    const assignments = await listAssignments(user.sub, user.role, patientIdFilter);
    res.json(assignments);
  }),
);
