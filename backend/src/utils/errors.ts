export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, 'REQUETE_INVALIDE', message, details);
export const unauthorized = (message = 'Authentification requise') =>
  new AppError(401, 'NON_AUTHENTIFIE', message);
export const invalid = (message: string, details?: unknown) =>
  new AppError(422, 'VALIDATION', message, details);
export const forbidden = (message = 'Accès refusé') => new AppError(403, 'INTERDIT', message);
export const notFound = (message = 'Ressource introuvable') =>
  new AppError(404, 'INTROUVABLE', message);
export const conflict = (message: string) => new AppError(409, 'CONFLIT', message);
export const tooLarge = (message: string) => new AppError(413, 'TROP_VOLUMINEUX', message);
export const unsupportedMediaType = (message: string) =>
  new AppError(415, 'TYPE_NON_SUPPORTE', message);
