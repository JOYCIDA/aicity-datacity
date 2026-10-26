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
