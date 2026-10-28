export type Choix<T> = { valeur: T; libelle: string };

// tempsLibreMinutes
export const DUREES: Choix<number>[] = [
  { valeur: 30, libelle: '30 min' },
  { valeur: 60, libelle: '1 h' },
  { valeur: 90, libelle: '1 h 30' },
  { valeur: 120, libelle: '2 h' },
  { valeur: 180, libelle: '3 h' },
];

// budgetMax (null = sans limite)
export const BUDGETS: Choix<number | null>[] = [
  { valeur: 0, libelle: 'Gratuit' },
  { valeur: 10, libelle: "Jusqu'à 10 €" },
  { valeur: 20, libelle: "Jusqu'à 20 €" },
  { valeur: 50, libelle: "Jusqu'à 50 €" },
  { valeur: null, libelle: 'Sans limite' },
];

// categories (codes du backend)
export const CATEGORIES: Choix<string>[] = [
  { valeur: 'culture', libelle: 'Culture' },
  { valeur: 'gastronomie', libelle: 'Gastronomie' },
  { valeur: 'nature', libelle: 'Nature' },
  { valeur: 'sport', libelle: 'Sport' },
  { valeur: 'loisirs', libelle: 'Loisirs' },
  { valeur: 'shopping', libelle: 'Shopping' },
];