import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, notFound } from '../utils/errors.js';
import { env } from '../config/env.js';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(notFound(`Route ${req.method} ${req.path} introuvable`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      erreur: { code: 'VALIDATION', message: 'Données invalides', details: err.issues },
    });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      erreur: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }
  if (env.NODE_ENV !== 'test') console.error(err);
  res.status(500).json({
    erreur: { code: 'ERREUR_INTERNE', message: 'Erreur interne du serveur' },
  });
};
