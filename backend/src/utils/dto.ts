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
  photoCredit: true,
  photoAlt: true,
  titreEn: true,
  descriptionEn: true,
  lieuEn: true,
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

export type LangueContenu = 'FR' | 'EN';

/**
 * Vue publique : sans motif de refus ni statut de modération. Les champs `titre`, `description`
 * et `lieu` sont rendus dans la langue demandée ; sans traduction, le français sert de repli.
 * `traduit` vaut false quand un de ces champs est resté en français alors que l'anglais était
 * demandé (l'interface peut alors l'indiquer).
 */
export function offrePubliqueDto(o: OffreSelectionnee, langue: LangueContenu = 'FR') {
  const { motifRefus: _m, statut: _s, titreEn, descriptionEn, lieuEn, ...publique } = offreDto(o);
  if (langue !== 'EN') return { ...publique, langue: 'FR' as LangueContenu, traduit: true };
  return {
    ...publique,
    titre: titreEn ?? publique.titre,
    description: publique.description === null ? null : (descriptionEn ?? publique.description),
    lieu: lieuEn ?? publique.lieu,
    langue: 'EN' as LangueContenu,
    traduit: titreEn !== null && lieuEn !== null && (publique.description === null || descriptionEn !== null),
  };
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
