// Contrôle de qualité des coordonnées importées. Certaines sources, quand une adresse n'est
// pas trouvée, placent l'événement sur un point par défaut (le centre de Paris) : il
// apparaîtrait alors à côté de n'importe quel usager du centre-ville.
import { sansAccents } from './categories.js';

export interface PointOffre {
  adresse?: string | null;
  lieu?: string | null;
  latitude: number;
  longitude: number;
}

/** Point que « Que faire à Paris ? » attribue aux adresses qu'il ne sait pas placer. */
export const POINT_PAR_DEFAUT_PARIS = { latitude: 48.856578, longitude: 2.351828 };
const TOLERANCE_DEGRES = 0.00003; // ≈ 3 m
// Ce point est aussi celui de l'Hôtel de Ville : on n'y croit que si le texte le confirme.
const CONFIRME_HOTEL_DE_VILLE = /\b(hotel de ville|rivoli|parvis)/;
/** Au-delà de ce nombre d'adresses différentes sur un même point, aucune n'est crédible. */
const SEUIL_ADRESSES_PARTAGEES = 3;

const cleAdresse = (o: PointOffre) =>
  sansAccents(o.adresse ?? o.lieu ?? '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const surPointParDefaut = (o: PointOffre) =>
  Math.abs(o.latitude - POINT_PAR_DEFAUT_PARIS.latitude) < TOLERANCE_DEGRES &&
  Math.abs(o.longitude - POINT_PAR_DEFAUT_PARIS.longitude) < TOLERANCE_DEGRES;

/**
 * Sépare les offres dont les coordonnées sont crédibles des autres :
 *  - sur le point par défaut de Paris sans que l'adresse le confirme ;
 *  - sur un point (au mètre près) partagé par trois adresses différentes ou plus : on ne garde
 *    alors que l'adresse majoritaire, si elle porte au moins la moitié des offres du point.
 */
export function ecarterCoordonneesDouteuses<T extends PointOffre>(offres: readonly T[]) {
  const ecartees = new Set<T>();

  for (const o of offres) {
    if (surPointParDefaut(o) && !CONFIRME_HOTEL_DE_VILLE.test(sansAccents(`${o.adresse ?? ''} ${o.lieu ?? ''}`))) {
      ecartees.add(o);
    }
  }

  const parPoint = new Map<string, T[]>();
  for (const o of offres) {
    if (ecartees.has(o)) continue;
    const cle = `${o.latitude.toFixed(5)},${o.longitude.toFixed(5)}`;
    parPoint.set(cle, [...(parPoint.get(cle) ?? []), o]);
  }
  for (const groupe of parPoint.values()) {
    const parAdresse = new Map<string, T[]>();
    for (const o of groupe) parAdresse.set(cleAdresse(o), [...(parAdresse.get(cleAdresse(o)) ?? []), o]);
    if (parAdresse.size < SEUIL_ADRESSES_PARTAGEES) continue;
    const [majoritaire] = [...parAdresse.entries()].sort((a, b) => b[1].length - a[1].length);
    const garder = majoritaire && majoritaire[1].length * 2 >= groupe.length ? majoritaire[0] : null;
    for (const o of groupe) if (cleAdresse(o) !== garder) ecartees.add(o);
  }

  return { gardees: offres.filter((o) => !ecartees.has(o)), ecartees: offres.filter((o) => ecartees.has(o)) };
}
