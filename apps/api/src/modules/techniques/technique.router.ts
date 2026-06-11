import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { AppError } from '../../lib/errors';
import { TechniqueBody } from './technique.schema';
import {
  createTechnique,
  listTechniques,
  updateTechnique,
  deleteTechnique,
} from './technique.service';

export const techniqueRouter = Router();

const auth = [authenticate, requireRole('therapist')];

// GET /techniques?category=X
techniqueRouter.get(
  '/',
  ...auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category =
        typeof req.query.category === 'string' ? req.query.category : undefined;
      const techniques = await listTechniques(req.user!.sub, category);
      res.json(techniques);
    } catch (err) {
      next(err);
    }
  },
);

// POST /techniques
techniqueRouter.post(
  '/',
  ...auth,
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = TechniqueBody.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError(422, 'validation_error', parsed.error.errors[0].message));
    }
    try {
      const technique = await createTechnique(req.user!.sub, parsed.data);
      res.status(201).json(technique);
    } catch (err) {
      next(err);
    }
  },
);

// PUT /techniques/:id
techniqueRouter.put(
  '/:id',
  ...auth,
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = TechniqueBody.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError(422, 'validation_error', parsed.error.errors[0].message));
    }
    try {
      const technique = await updateTechnique(req.user!.sub, req.params.id, parsed.data);
      res.json(technique);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /techniques/:id
techniqueRouter.delete(
  '/:id',
  ...auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteTechnique(req.user!.sub, req.params.id);
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  },
);
