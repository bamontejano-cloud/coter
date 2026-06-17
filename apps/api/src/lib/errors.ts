export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Factory helpers for the standard error responses the API returns.
 * Factories (not singletons) so each `throw` carries a fresh stack trace
 * pointing at the actual call site, not at module bootstrap.
 */
export const Errors = {
  unauthorized: () =>
    new AppError(401, 'unauthorized', 'Sesión no válida o expirada'),
  invalidCredentials: () =>
    new AppError(401, 'invalid_credentials', 'Credenciales inválidas'),
  forbidden: () =>
    new AppError(403, 'forbidden', 'Acceso denegado'),
  notFound: () =>
    new AppError(404, 'not_found', 'Recurso no encontrado'),
  invalidInvitation: () =>
    new AppError(400, 'invalid_invitation', 'La invitación no es válida o ha expirado'),
  emailAlreadyExists: () =>
    new AppError(409, 'email_already_exists', 'El correo electrónico ya está registrado'),
  validation: (message: string) =>
    new AppError(422, 'validation_error', message),
} as const;

// Re-export from shared so importing `{ AppError, Errors, ErrorCodes }`
// from `./errors` works the same across the API and the shared package.
export { ErrorCodes } from '@coterapeuta/shared';
