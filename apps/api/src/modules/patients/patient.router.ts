import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { listPatients, getPatientProfile } from './patient.service';

export const patientRouter = Router();

// GET /patients — therapist only
patientRouter.get(
  '/',
  authenticate,
  requireRole('therapist'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patients = await listPatients(req.user!.sub);
      res.json(patients);
    } catch (err) {
      next(err);
    }
  }
);

// GET /patients/:id — therapist only, own patients
patientRouter.get(
  '/:id',
  authenticate,
  requireRole('therapist'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await getPatientProfile(req.user!.sub, req.params.id);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }
);
