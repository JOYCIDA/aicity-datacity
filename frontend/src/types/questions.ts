export type Choix<T> = { valeur: T; libelle: string };

export type SaisieLibre = { min: number; max: number; pas: number; unite: string; libelle: string };

// Les 3 questions, telles que le backend les fournit (GET /api/citoyen/questions).
export type Questions = {
  durees: Choix<number>[];
  budgets: Choix<number | null>[];
  budgetLibre: SaisieLibre | null;
  categories: Choix<string>[];
};
