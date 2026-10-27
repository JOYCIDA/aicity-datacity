import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/** Limite les tentatives sur les routes sensibles (force brute). */
export const limiteAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: {
    erreur: { code: 'TROP_DE_REQUETES', message: 'Trop de tentatives, réessayez plus tard' },
  },
});
