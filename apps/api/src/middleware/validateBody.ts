import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../lib/errors';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstError = (result.error as ZodError).errors[0];
      return next(new AppError(422, 'validation_error', firstError.message));
    }
    req.body = result.data;
    next();
  };
}
