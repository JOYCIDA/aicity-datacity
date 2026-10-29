// Modèle d'affichage, construit à partir d'un résultat du backend (voir api/adaptateur.ts).
export type Activite = {
  id: string;
  titre: string;
  categorie: string; // code du backend : culture, gastronomie...
  categorieLibelle: string;
  description: string | null;
  photo_url: string | null;
  photo_credit: string | null; // à afficher sous la photo (droit d'auteur)
  photo_alt: string | null; // description lue par les lecteurs d'écran
  lieu: string;
  adresse: string | null;
  lat: number;
  lng: number;
  horaires: string;
  prix: number | null; // 0 = gratuit ; null = prix non communiqué
  distance_m: number;
  trajet_min: number;
  source: string;
  source_url: string | null;
  date_maj: string; // JJ/MM/AAAA
  explication: string; // « Pourquoi cette proposition ? »
};
