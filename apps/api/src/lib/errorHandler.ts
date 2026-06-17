import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCodes } from './errors';

/**
 * Global Express error handler. Exports shape `{ error: <code>, message: <text> }`.
 * Exported so tests can mount the same middleware on their test apps,
 * instead of re-implementing it (as `property-26-role-access-control.test.ts` did).
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.code, message: err.message });
  }
  console.error('Unhandled error:', err);
  return res
    .status(500)
    .json({ error: ErrorCodes.INTERNAL_ERROR, message: 'Error interno del servidor' });
}
