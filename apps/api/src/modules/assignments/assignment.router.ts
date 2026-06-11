import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate';
import { AppError } from '../../lib/errors';
import { createAssignment, listAssignments } from './assignment.service';

export const assignmentRouter = Router();

const AssignmentBody = z.object({
  techniqueId: z.string().uuid(),
  patientId: z.string().uuid(),
  therapistNotes: z.string().optional(),
});

// POST /assignments — therapist only
assignmentRouter.post(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.user!.role !== 'therapist') {
      return next(new AppError(403, 'forbidden', 'Acceso denegado'));
    }
    const parsed = AssignmentBody.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError(422, 'validation_error', parsed.error.errors[0].message));
    }
    try {
      const assignment = await createAssignment(req.user!.sub, parsed.data);
      res.status(201).json(assignment);
    } catch (err) {
      next(err);
    }
  },
);

// GET /assignments — both roles
assignmentRouter.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientIdFilter =
        typeof req.query.patientId === 'string' ? req.query.patientId : undefined;
      const assignments = await listAssignments(req.user!.sub, req.user!.role, patientIdFilter);
      res.json(assignments);
    } catch (err) {
      next(err);
    }
  },
);
