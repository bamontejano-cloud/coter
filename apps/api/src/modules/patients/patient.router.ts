import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { ah } from '../../lib/asyncHandler';
import { currentUser } from '../../lib/currentUser';
import { listPatients, getPatientProfile } from './patient.service';

export const patientRouter = Router();

// GET /patients — therapist only
patientRouter.get(
  '/',
  authenticate,
  requireRole('therapist'),
  ah(async (req, res) => {
    const patients = await listPatients(currentUser(req).sub);
    res.json(patients);
  }),
);

// GET /patients/:id — therapist only, own patients
patientRouter.get(
  '/:id',
  authenticate,
  requireRole('therapist'),
  ah(async (req, res) => {
    const profile = await getPatientProfile(currentUser(req).sub, req.params.id);
    res.json(profile);
  }),
);
