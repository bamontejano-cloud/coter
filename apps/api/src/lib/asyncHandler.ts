import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async (or sync) handler so any thrown error — sync or async —
 * reaches the Express error pipeline via `next(err)`.
 *
 * The try/await form is deliberate: `Promise.resolve(fn(...))` would
 * evaluate `fn` synchronously before .catch attaches, so a sync throw
 * inside `fn` would escape the wrapper.
 */
export function ah(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve()
      .then(() => fn(req, res, next))
      .catch(next);
  };
}
