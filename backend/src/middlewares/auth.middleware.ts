import type { RequestHandler } from 'express';
import type { Role } from '../generated/prisma/client.js';
import { forbidden, unauthorized } from '../utils/errors.js';
import { verifierToken } from '../utils/jwt.js';

/** Exige un en-tête `Authorization: Bearer <jwt>` valide (401 sinon). */
export const verifierJwt: RequestHandler = (req, _res, next) => {
  const entete = req.headers.authorization;
  if (!entete?.startsWith('Bearer ')) {
    next(unauthorized());
    return;
  }
  const payload = verifierToken(entete.slice('Bearer '.length).trim());
  if (!payload) {
    next(unauthorized('Jeton invalide ou expiré'));
    return;
  }
  req.utilisateur = { id: payload.sub, role: payload.role };
  next();
};

/** À placer après `verifierJwt` : 403 si le rôle n'est pas autorisé (RG15). */
export const exigerRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.utilisateur) {
      next(unauthorized());
      return;
    }
    if (!roles.includes(req.utilisateur.role)) {
      next(forbidden());
      return;
    }
    next();
  };
