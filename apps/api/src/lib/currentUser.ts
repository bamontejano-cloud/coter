import { Request } from 'express';
import { JwtPayload } from './jwt';
import { Errors } from './errors';

/**
 * Type-safe accessor for the authenticated user attached by `authenticate`.
 * Throws a 401 AppError when called from a route that did not mount
 * `authenticate`, so it is impossible to consume `req.user!` unsafely.
 */
export function currentUser(req: Request): JwtPayload {
  if (!req.user) throw Errors.unauthorized();
  return req.user;
}
