import type { Request, RequestHandler, Response } from 'express';
import type { Role } from '../generated/prisma/client.js';
import * as sessionService from '../services/session.service.js';
import { forbidden, unauthorized } from '../utils/errors.js';
import { verifierJetonAnonyme, verifierJetonSession, verifierToken } from '../utils/jwt.js';

const jetonBearer = (req: Request) => {
  const entete = req.headers.authorization;
  return entete?.startsWith('Bearer ') ? entete.slice('Bearer '.length).trim() : null;
};

/** Exige un en-tête `Authorization: Bearer <jwt>` valide (401 sinon). */
export const verifierJwt: RequestHandler = (req, _res, next) => {
  const jeton = jetonBearer(req);
  if (!jeton) {
    next(unauthorized());
    return;
  }
  const payload = verifierToken(jeton);
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

/**
 * Si `jeton` est un jeton de session de borne : prolonge la session (RG1) et la place sur la
 * requête. Renvoie false si ce n'en est pas un ; lève 401 si la session est échue (elle vient
 * alors d'être supprimée). L'échéance est renvoyée dans l'en-tête X-Session-Expire-Le.
 */
async function ouvrirSession(req: Request, res: Response, jeton: string) {
  const sessionId = verifierJetonSession(jeton);
  if (!sessionId) return false;
  const session = await sessionService.prolonger(sessionId);
  if (!session) throw unauthorized('Session expirée');
  req.sessionBorne = session;
  res.set('X-Session-Expire-Le', session.expireLe.toISOString());
  return true;
}

/** Exige un jeton de session de borne valide (401 sinon). */
export const exigerSession: RequestHandler = async (req, res, next) => {
  const jeton = jetonBearer(req);
  if (!jeton || !(await ouvrirSession(req, res, jeton))) throw unauthorized('Session de borne requise');
  next();
};

/**
 * Mode mobile avec compte (jeton CITOYEN), mobile sans compte (session anonyme) ou mode borne
 * (jeton de session) ; tout autre rôle : 403.
 */
export const citoyenOuSession: RequestHandler = async (req, res, next) => {
  const jeton = jetonBearer(req);
  if (!jeton) throw unauthorized();
  if (await ouvrirSession(req, res, jeton)) return next();
  if (verifierJetonAnonyme(jeton)) {
    req.anonyme = true;
    return next();
  }

  const payload = verifierToken(jeton);
  if (!payload) throw unauthorized('Jeton invalide ou expiré');
  if (payload.role !== 'CITOYEN') throw forbidden();
  req.utilisateur = { id: payload.sub, role: payload.role };
  next();
};

/**
 * Routes publiques : sans jeton ou avec un jeton de compte, rien ne change ; avec un jeton de
 * session, l'appel compte comme une activité (RG1) et une session échue reçoit 401.
 */
export const sessionSiPresente: RequestHandler = async (req, res, next) => {
  const jeton = jetonBearer(req);
  if (jeton) await ouvrirSession(req, res, jeton);
  next();
};
