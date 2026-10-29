import * as Location from 'expo-location';
import { POSITION_PAR_DEFAUT } from '../config';

export type Position = { latitude: number; longitude: number };

// Pourquoi on cherche autour du centre de Paris plutôt qu'autour du citoyen (texte dans i18n.ts).
export type RemarquePosition = 'refusee' | 'horsParis' | 'introuvable';
export type ResultatPosition = { position: Position; remarque: RemarquePosition | null };

// Les données couvrent Paris : au-delà, on cherche autour du centre.
const DISTANCE_MAX_PARIS_M = 15_000;

function distanceM(a: Position, b: Position): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

// La position reste dans l'appli le temps de la recherche : elle n'est jamais stockée.
export async function obtenirPosition(): Promise<ResultatPosition> {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) return { position: POSITION_PAR_DEFAUT, remarque: 'refusee' };
    const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const position = { latitude: coords.latitude, longitude: coords.longitude };
    if (distanceM(position, POSITION_PAR_DEFAUT) > DISTANCE_MAX_PARIS_M) {
      return { position: POSITION_PAR_DEFAUT, remarque: 'horsParis' };
    }
    return { position, remarque: null };
  } catch {
    return { position: POSITION_PAR_DEFAUT, remarque: 'introuvable' };
  }
}
