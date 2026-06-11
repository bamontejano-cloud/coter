import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'unauthorized', 'Sesión no válida o expirada'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'forbidden', 'Acceso denegado'));
    }
    next();
  };
}
