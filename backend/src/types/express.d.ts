import type { Langue, Role } from '../generated/prisma/client.js';

declare global {
  namespace Express {
    interface Request {
      /** Renseigné par `verifierJwt` après authentification. */
      utilisateur?: { id: string; role: Role };
      /** Vrai quand la requête porte un jeton de session anonyme de mobile (rien n'est enregistré). */
      anonyme?: boolean;
      /** Renseigné par `exigerBorne` (en-tête X-Borne-Key). */
      borne?: { id: string; nom: string; emplacement: string; latitude: number; longitude: number };
      /** Renseigné par les middlewares de session : session de borne en cours, déjà prolongée. */
      sessionBorne?: {
        id: string;
        borneId: string;
        langue: Langue;
        expireLe: Date;
        /** RG2 : position de la borne, utilisée à la place de celle de l'usager. */
        position: { latitude: number; longitude: number };
      };
    }
  }
}

export {};
