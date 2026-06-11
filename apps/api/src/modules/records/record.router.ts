import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { AppError } from '../../lib/errors';
import { RecordBody } from './record.schema';
import { submitRecord, getRecord } from './record.service';

export const recordRouter = Router();

// POST /records — patient only
recordRouter.post(
  '/',
  authenticate,
  requireRole('patient'),
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = RecordBody.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError(422, 'validation_error', parsed.error.errors[0].message));
    }
    try {
      const record = await submitRecord(req.user!.sub, parsed.data);
      res.status(201).json(record);
    } catch (err) {
      next(err);
    }
  }
);

// GET /records/:assignmentId — both roles
recordRouter.get(
  '/:assignmentId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = await getRecord(req.user!.sub, req.user!.role, req.params.assignmentId);
      res.json(record);
    } catch (err) {
      next(err);
    }
  }
);
