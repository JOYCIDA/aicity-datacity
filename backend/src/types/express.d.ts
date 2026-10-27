import type { Role } from '../generated/prisma/client.js';

declare global {
  namespace Express {
    interface Request {
      /** Renseigné par `verifierJwt` après authentification. */
      utilisateur?: { id: string; role: Role };
    }
  }
}

export {};
