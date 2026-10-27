// Filtres de recommandation : fonctions pures, sans base ni horloge implicite.
import { distanceMetres, minutesAPied, type Point } from '../utils/geo.js';

export interface Candidat {
  id: string;
  statut: string;
  categorie: { code: string; libelleFr: string; libelleEn: string };
  latitude: number;
  longitude: number;
  debut: Date;
  fin: Date | null;
  dureeMinutes: number;
  gratuit: boolean;
  prix: number | null;
  creeLe: Date;
}

export interface Demande {
  position: Point;
  tempsLibreMinutes: number;
  /** null : pas de limite ; 0 : gratuit uniquement. */
  budgetMax: number | null;
  /** Vide : toutes les catégories. */
  categories: readonly string[];
  maintenant: Date;
}

/** Candidat retenu, avec ce qu'il faut pour le noter et l'expliquer. */
export interface CandidatEvalue<C extends Candidat = Candidat> {
  offre: C;
  distanceM: number;
  trajetMinutes: number;
  /** Attente sur place avant le début de l'activité (0 si déjà en cours). */
  attenteMinutes: number;
  /** Temps libre restant une fois l'activité terminée. */
  margeMinutes: number;
}

export type MotifExclusion = 'statut' | 'rayon' | 'creneau' | 'budget' | 'categorie';

const minutesEntre = (a: Date, b: Date) => (b.getTime() - a.getTime()) / 60_000;

export function evaluer<C extends Candidat>(
  offre: C,
  demande: Demande,
  rayonM: number,
): { retenu: CandidatEvalue<C> } | { exclu: MotifExclusion } {
  // RG4 : seules les offres validées sont proposées, quelle que soit la requête qui les a lues.
  if (offre.statut !== 'VALIDE') return { exclu: 'statut' };

  if (demande.categories.length > 0 && !demande.categories.includes(offre.categorie.code)) {
    return { exclu: 'categorie' };
  }

  // RG11 : budget nul = gratuit seulement ; un prix inconnu ne passe que sans limite de budget.
  if (demande.budgetMax !== null && !offre.gratuit) {
    if (offre.prix === null || offre.prix > demande.budgetMax) return { exclu: 'budget' };
  }

  const distanceM = distanceMetres(demande.position, offre);
  if (distanceM > rayonM) return { exclu: 'rayon' };

  // Créneau : on arrive après le trajet (RG14) ; l'activité commence à l'arrivée ou à
  // l'ouverture de l'offre, et doit finir dans le temps libre comme avant la fin de l'offre.
  const trajetMinutes = minutesAPied(distanceM);
  const debutActivite = Math.max(trajetMinutes, minutesEntre(demande.maintenant, offre.debut));
  const finActivite = debutActivite + offre.dureeMinutes;
  if (finActivite > demande.tempsLibreMinutes) return { exclu: 'creneau' };
  if (offre.fin && finActivite > minutesEntre(demande.maintenant, offre.fin)) return { exclu: 'creneau' };

  return {
    retenu: {
      offre,
      distanceM: Math.round(distanceM),
      trajetMinutes,
      attenteMinutes: Math.round(debutActivite - trajetMinutes),
      margeMinutes: Math.floor(demande.tempsLibreMinutes - finActivite),
    },
  };
}

export function filtrer<C extends Candidat>(offres: readonly C[], demande: Demande, rayonM: number) {
  const retenus: CandidatEvalue<C>[] = [];
  for (const offre of offres) {
    const r = evaluer(offre, demande, rayonM);
    if ('retenu' in r) retenus.push(r.retenu);
  }
  return retenus;
}
