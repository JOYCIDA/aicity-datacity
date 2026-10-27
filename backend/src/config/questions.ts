// Questions posées au citoyen avant une recommandation (UC2), en FR et EN. Les valeurs
// correspondent aux champs de POST /api/citoyen/recommandations.
import { CODES_CATEGORIES } from '../adapters/categories.js';

type Libelle = { FR: string; EN: string };

/** Bornes du budget saisi librement, partagées avec la validation de la requête. */
export const BUDGET_SAISI = { min: 0, max: 10_000, pas: 0.01 } as const;

export interface Question {
  id: 'tempsLibreMinutes' | 'budgetMax' | 'categories';
  libelle: Libelle;
  choixMultiple: boolean;
  /** Raccourcis proposés à l'écran. */
  choix: { valeur: number | string | null; libelle: Libelle }[];
  /** Si présent, l'interface propose aussi un champ numérique libre. */
  saisieLibre?: {
    min: number;
    max: number;
    pas: number;
    unite: string;
    libelle: Libelle;
  };
}

const LIBELLES_CATEGORIES: Record<(typeof CODES_CATEGORIES)[number], Libelle> = {
  culture: { FR: 'Culture', EN: 'Culture' },
  gastronomie: { FR: 'Gastronomie', EN: 'Food & drink' },
  nature: { FR: 'Nature', EN: 'Nature' },
  sport: { FR: 'Sport', EN: 'Sport' },
  loisirs: { FR: 'Loisirs', EN: 'Leisure' },
  shopping: { FR: 'Shopping', EN: 'Shopping' },
};

export const QUESTIONS: Question[] = [
  {
    id: 'tempsLibreMinutes',
    libelle: { FR: 'Combien de temps avez-vous ?', EN: 'How much time do you have?' },
    choixMultiple: false,
    choix: [
      { valeur: 30, libelle: { FR: '30 min', EN: '30 min' } },
      { valeur: 60, libelle: { FR: '1 h', EN: '1 hr' } },
      { valeur: 90, libelle: { FR: '1 h 30', EN: '1.5 hrs' } },
      { valeur: 120, libelle: { FR: '2 h', EN: '2 hrs' } },
      { valeur: 180, libelle: { FR: '3 h', EN: '3 hrs' } },
    ],
  },
  {
    id: 'budgetMax',
    libelle: { FR: 'Quel est votre budget ?', EN: 'What is your budget?' },
    choixMultiple: false,
    choix: [
      { valeur: 0, libelle: { FR: 'Gratuit', EN: 'Free' } },
      { valeur: 10, libelle: { FR: '10 €', EN: '€10' } },
      { valeur: 20, libelle: { FR: '20 €', EN: '€20' } },
      { valeur: 50, libelle: { FR: '50 €', EN: '€50' } },
      { valeur: null, libelle: { FR: 'Sans limite', EN: 'No limit' } },
    ],
    saisieLibre: {
      ...BUDGET_SAISI,
      unite: '€',
      libelle: { FR: 'Autre montant', EN: 'Other amount' },
    },
  },
  {
    id: 'categories',
    libelle: { FR: 'Qu’avez-vous envie de faire ?', EN: 'What would you like to do?' },
    choixMultiple: true,
    choix: CODES_CATEGORIES.map((code) => ({ valeur: code, libelle: LIBELLES_CATEGORIES[code] })),
  },
];
