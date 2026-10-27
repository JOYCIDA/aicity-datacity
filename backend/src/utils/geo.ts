export interface Point {
  latitude: number;
  longitude: number;
}

const RAYON_TERRE_M = 6_371_000;
// RG14 : la marche réelle suit les rues, d'où un détour forfaitaire de 30 % à 5 km/h.
export const FACTEUR_DETOUR = 1.3;
export const VITESSE_MARCHE_KMH = 5;

const radians = (deg: number) => (deg * Math.PI) / 180;

/** Distance à vol d'oiseau en mètres (formule de Haversine). */
export function distanceMetres(a: Point, b: Point): number {
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * RAYON_TERRE_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** RG14 : durée du trajet à pied, en minutes entières (arrondi supérieur). */
export function minutesAPied(distanceM: number): number {
  const metresParMinute = (VITESSE_MARCHE_KMH * 1000) / 60;
  return Math.ceil((distanceM * FACTEUR_DETOUR) / metresParMinute);
}

/**
 * Rectangle qui contient le cercle (centre, rayon) : préfiltre SQL sur les index latitude /
 * longitude, avant le calcul exact de la distance. Valable loin des pôles, ce qui suffit ici.
 */
export function boiteEnglobante(centre: Point, rayonM: number) {
  const dLat = (rayonM / RAYON_TERRE_M) * (180 / Math.PI);
  const dLon = dLat / Math.cos(radians(centre.latitude));
  return {
    latMin: centre.latitude - dLat,
    latMax: centre.latitude + dLat,
    lonMin: centre.longitude - dLon,
    lonMax: centre.longitude + dLon,
  };
}
