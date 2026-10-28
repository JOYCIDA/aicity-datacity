import jwt from 'jsonwebtoken';
import type { Role } from '../generated/prisma/client.js';
import { env } from '../config/env.js';

export interface JwtPayload {
  sub: string;
  role: Role;
}

export function signerToken(utilisateur: { id: string; role: Role }): string {
  return jwt.sign({ role: utilisateur.role }, env.JWT_SECRET, {
    subject: utilisateur.id,
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

/** Renvoie le contenu du jeton, ou `null` s'il est invalide ou expiré. */
export function verifierToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof decoded === 'string' || typeof decoded.sub !== 'string') return null;
    const role = decoded['role'];
    if (role !== 'CITOYEN' && role !== 'ENTREPRISE' && role !== 'ADMIN') return null;
    return { sub: decoded.sub, role };
  } catch {
    return null;
  }
}

/** Jeton court d'une session de borne : il ne porte que l'identifiant de la session. */
export function signerJetonSession(sessionId: string, dureeSecondes: number): string {
  return jwt.sign({ typ: 'session' }, env.JWT_SECRET, { subject: sessionId, expiresIn: dureeSecondes });
}

/** Identifiant de session, ou `null` si le jeton n'est pas un jeton de session valide. */
export function verifierJetonSession(token: string): string | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof decoded === 'string' || decoded['typ'] !== 'session') return null;
    return typeof decoded.sub === 'string' ? decoded.sub : null;
  } catch {
    return null;
  }
}

/**
 * Jeton d'une session anonyme de mobile : aucun compte, aucune ligne en base. Il ne sert qu'à
 * prouver que l'appelant est passé par `POST /citoyen/sessions/anonyme` (et son limiteur).
 */
export function signerJetonAnonyme(dureeSecondes: number): string {
  return jwt.sign({ typ: 'anonyme' }, env.JWT_SECRET, { expiresIn: dureeSecondes });
}

export function verifierJetonAnonyme(token: string): boolean {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    return typeof decoded !== 'string' && decoded['typ'] === 'anonyme';
  } catch {
    return false;
  }
}
