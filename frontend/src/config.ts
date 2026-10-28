export const SIGNALEMENT_ACTIF = false;

// Sur un vrai téléphone, remplacer localhost par l'adresse IP de l'ordinateur (EXPO_PUBLIC_API_URL).
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api';
