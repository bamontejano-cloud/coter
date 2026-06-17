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
  // TODO(debug-2026-06-17): remove once the Railway 500 is diagnosed.
  // One structured log line so the timestamp correlates cleanly with the
  // matching HTTP 500 entry in Railway. Hand-build the shape instead of
  // JSON.stringify — errors can have circular refs (Prisma client errors do).
  console.error('Unhandled error:', {
    type: typeof err,
    name: err instanceof Error ? err.name : '(non-Error)',
    value: err,
    stack: err instanceof Error && err.stack ? err.stack : '(no stack)',
  });
  return res
    .status(500)
    .json({ error: ErrorCodes.INTERNAL_ERROR, message: 'Error interno del servidor' });
}
