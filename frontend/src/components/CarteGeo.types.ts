import { Activite } from '../types/activite';
import { Position } from '../utils/position';

// Partagé par CarteGeo.web.tsx (Leaflet, navigateur et borne) et CarteGeo.tsx (téléphone).
export type PropsCarteGeo = {
  position: Position; // « Vous êtes ici »
  activites: Activite[]; // numérotées 1, 2, 3… comme dans la liste
  onOuvrir: (activite: Activite) => void;
};

// Cadre qui englobe le citoyen et toutes les activités.
export function cadre({ position, activites }: Pick<PropsCarteGeo, 'position' | 'activites'>) {
  const lats = [position.latitude, ...activites.map((a) => a.lat)];
  const lngs = [position.longitude, ...activites.map((a) => a.lng)];
  return {
    latMin: Math.min(...lats),
    latMax: Math.max(...lats),
    lngMin: Math.min(...lngs),
    lngMax: Math.max(...lngs),
  };
}
