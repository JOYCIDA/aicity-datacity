export const SIGNALEMENT_ACTIF = false;

// Sur un vrai téléphone, remplacer localhost par l'adresse IP de l'ordinateur (EXPO_PUBLIC_API_URL).
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api';

// Centre de Paris : utilisé si la position du citoyen est refusée, introuvable ou hors de Paris.
// Sans aucune interaction pendant ce temps, la session se termine (borne laissée seule).
export const INACTIVITE_FIN_MS = 3 * 60_000;
// Compte à rebours de l'écran de fin avant le retour à l'accueil.
export const RETOUR_ACCUEIL_SECONDES = 10;

export const POSITION_PAR_DEFAUT = { latitude: 48.8566, longitude: 2.3522 };
