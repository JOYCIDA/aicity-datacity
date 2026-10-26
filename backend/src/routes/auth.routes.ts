import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import * as auth from '../controllers/auth.controller.js';
import { verifierJwt } from '../middlewares/auth.middleware.js';

export const authRouter = Router();

// Freine les attaques par essais répétés sur l'inscription et la connexion.
const limiteur = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: {
    erreur: { code: 'TROP_DE_REQUETES', message: 'Trop de tentatives, réessayez plus tard' },
  },
});

authRouter.post('/inscription', limiteur, auth.inscription);
authRouter.post('/connexion', limiteur, auth.connexion);
authRouter.get('/moi', verifierJwt, auth.moi);
