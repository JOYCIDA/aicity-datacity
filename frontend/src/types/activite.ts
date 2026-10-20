export type Activite = {
  id: string;
  titre: string;
  categorie: 'musique' | 'expos' | 'sport' | 'food' | 'nature' | 'autre';
  lieu: string;
  lat: number;
  lng: number;
  horaires: string;
  prix: number; // 0 = gratuit
  distance_m: number;
  source: string;
  date_maj: string; // AAAA-MM-JJ
  raisons: string[]; // pour « Pourquoi cette proposition ? »
};