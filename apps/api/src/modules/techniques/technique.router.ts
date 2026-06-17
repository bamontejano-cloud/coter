import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { validateBody } from '../../middleware/validateBody';
import { ah } from '../../lib/asyncHandler';
import { currentUser } from '../../lib/currentUser';
import { TechniqueBody } from './technique.schema';
import {
  createTechnique,
  listTechniques,
  updateTechnique,
  deleteTechnique,
} from './technique.service';

export const techniqueRouter = Router();

const therapistOnly = [authenticate, requireRole('therapist')];

// GET /techniques?category=X
techniqueRouter.get(
  '/',
  ...therapistOnly,
  ah(async (req, res) => {
    const category =
      typeof req.query.category === 'string' ? req.query.category : undefined;
    const techniques = await listTechniques(currentUser(req).sub, category);
    res.json(techniques);
  }),
);

// POST /techniques
techniqueRouter.post(
  '/',
  ...therapistOnly,
  validateBody(TechniqueBody),
  ah(async (req, res) => {
    const technique = await createTechnique(currentUser(req).sub, req.body);
    res.status(201).json(technique);
  }),
);

// PUT /techniques/:id
techniqueRouter.put(
  '/:id',
  ...therapistOnly,
  validateBody(TechniqueBody),
  ah(async (req, res) => {
    const technique = await updateTechnique(currentUser(req).sub, req.params.id, req.body);
    res.json(technique);
  }),
);

// DELETE /techniques/:id
techniqueRouter.delete(
  '/:id',
  ...therapistOnly,
  ah(async (req, res) => {
    await deleteTechnique(currentUser(req).sub, req.params.id);
    res.sendStatus(204);
  }),
);
