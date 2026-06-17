import { Router } from 'express';
import { validateBody } from '../../middleware/validateBody';
import { authenticate } from '../../middleware/authenticate';
import { ah } from '../../lib/asyncHandler';
import { RegisterBody, LoginBody } from './auth.schema';
import { register, login } from './auth.service';

export const authRouter = Router();

// POST /auth/register
authRouter.post(
  '/register',
  validateBody(RegisterBody),
  ah(async (req, res) => {
    const result = await register(req.body);
    res.status(201).json(result);
  }),
);

// POST /auth/login
authRouter.post(
  '/login',
  validateBody(LoginBody),
  ah(async (req, res) => {
    const result = await login(req.body);
    res.json(result);
  }),
);

// POST /auth/logout (protected, stateless — client discards token)
authRouter.post('/logout', authenticate, (_req, res) => {
  res.sendStatus(204);
});
