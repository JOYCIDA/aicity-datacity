import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/** Limite par adresse IP (la valeur n'est pas conservée au-delà de la fenêtre). Inactif en test. */
export const limiter = (limit: number, fenetreMinutes: number) =>
  rateLimit({
    windowMs: fenetreMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    message: {
      erreur: { code: 'TROP_DE_REQUETES', message: 'Trop de requêtes, réessayez plus tard' },
    },
  });
