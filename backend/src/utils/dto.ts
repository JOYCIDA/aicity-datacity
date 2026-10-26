// Mise en forme des réponses : sélections Prisma partagées et conversion en JSON simple
// (les Decimal deviennent des nombres, les chemins internes ne sortent pas).
import type { Prisma } from '../generated/prisma/client.js';

const selectionCategorie = { code: true, libelleFr: true, libelleEn: true, picto: true } as const;

export const selectionOffre = {
  id: true,
  titre: true,
  description: true,
  lieu: true,
  adresse: true,
  latitude: true,
  longitude: true,
  debut: true,
  fin: true,
  horaires: true,
  dureeMinutes: true,
  prix: true,
  gratuit: true,
  photoUrl: true,
  source: true,
  sourceUrl: true,
  statut: true,
  motifRefus: true,
  creeLe: true,
  majLe: true,
  categorie: { select: selectionCategorie },
  entreprise: { select: { id: true, nom: true } },
} as const satisfies Prisma.OffreSelect;

type OffreSelectionnee = Prisma.OffreGetPayload<{ select: typeof selectionOffre }>;

/** Vue complète, pour l'entreprise propriétaire et l'administration. */
export function offreDto(o: OffreSelectionnee) {
  return { ...o, prix: o.prix === null ? null : o.prix.toNumber() };
}

/** Vue publique : sans motif de refus ni statut de modération. */
export function offrePubliqueDto(o: OffreSelectionnee) {
  const { motifRefus: _m, statut: _s, ...publique } = offreDto(o);
  return publique;
}

export const selectionEntreprise = {
  id: true,
  nom: true,
  typeActivite: true,
  adresse: true,
  justificatifUrl: true,
  statut: true,
  motifRefus: true,
  creeLe: true,
  utilisateur: { select: { email: true } },
} as const satisfies Prisma.EntrepriseSelect;

type EntrepriseSelectionnee = Prisma.EntrepriseGetPayload<{ select: typeof selectionEntreprise }>;

/** Le chemin du justificatif reste interne : on indique seulement s'il a été fourni. */
export function entrepriseDto(e: EntrepriseSelectionnee) {
  const { justificatifUrl, utilisateur, ...reste } = e;
  return { ...reste, email: utilisateur.email, justificatifFourni: justificatifUrl !== null };
}

export function page<T>(elements: T[], total: number, p: { page: number; taille: number }) {
  return { elements, total, page: p.page, taille: p.taille };
}
