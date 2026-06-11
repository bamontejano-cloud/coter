import { Router, Request, Response, NextFunction } from 'express';
import { RegisterBody, LoginBody } from './auth.schema';
import { register, login } from './auth.service';
import { authenticate } from '../../middleware/authenticate';
import { AppError } from '../../lib/errors';

export const authRouter = Router();

// POST /auth/register
authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    return next(new AppError(422, 'validation_error', parsed.error.errors[0].message));
  }
  try {
    const result = await register(parsed.data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    return next(new AppError(422, 'validation_error', parsed.error.errors[0].message));
  }
  try {
    const result = await login(parsed.data);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /auth/logout (protected, stateless — client discards token)
authRouter.post('/logout', authenticate, (_req: Request, res: Response) => {
  res.sendStatus(204);
});
