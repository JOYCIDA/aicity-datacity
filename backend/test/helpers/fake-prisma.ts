import { randomUUID } from 'node:crypto';

type Ligne = Record<string, any>;

/** Mini base en mémoire qui imite les appels Prisma utilisés par l'authentification. */
export function creerFauxPrisma() {
  const utilisateurs: Ligne[] = [];
  const entreprises: Ligne[] = [];

  const projeter = (u: Ligne, select?: Ligne) => {
    if (!select) return { ...u };
    const out: Ligne = {};
    for (const [k, v] of Object.entries(select)) {
      if (!v) continue;
      if (k === 'entreprise') {
        const e = entreprises.find((x) => x.utilisateurId === u.id);
        out.entreprise = e
          ? { id: e.id, nom: e.nom, statut: e.statut, motifRefus: e.motifRefus }
          : null;
      } else out[k] = u[k];
    }
    return out;
  };

  return {
    utilisateurs,
    entreprises,
    utilisateur: {
      findUnique: async ({ where, select }: Ligne) => {
        const u = utilisateurs.find((x) => (where.id ? x.id === where.id : x.email === where.email));
        return u ? projeter(u, select) : null;
      },
      create: async ({ data, select }: Ligne) => {
        const { entreprise, ...reste } = data;
        const u = { id: randomUUID(), langue: 'FR', creeLe: new Date(), ...reste };
        utilisateurs.push(u);
        if (entreprise?.create) {
          entreprises.push({
            id: randomUUID(),
            utilisateurId: u.id,
            statut: 'EN_ATTENTE',
            motifRefus: null,
            ...entreprise.create,
          });
        }
        return projeter(u, select);
      },
    },
  };
}
