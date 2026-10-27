// Interprétation d'une demande en langage libre (« 2 h, gratuit, un musée ») en réponses
// aux questions de recommandation. RG3 : le texte n'est ni enregistré ni journalisé.
//
// Seule l'heuristique locale existe pour l'instant ; un vrai LLM pourra implémenter la même
// interface plus tard, l'heuristique restant le secours en cas de panne.
import { categoriesMentionnees, type CodeCategorie, sansAccents } from '../adapters/categories.js';

export interface Interpretation {
  /** Absent si le texte ne parle pas de durée. */
  tempsLibreMinutes?: number;
  /** Absent si le texte ne parle pas d'argent ; 0 pour « gratuit ». */
  budgetMax?: number;
  categories: CodeCategorie[];
}

export interface ClientInterpretation {
  interpreter(texte: string): Promise<Interpretation>;
}

const DUREE_MIN = 15;
const DUREE_MAX = 12 * 60;

// Expressions en toutes lettres, de la plus longue à la plus courte.
const DUREES_EN_LETTRES: [RegExp, number][] = [
  [/\b(une )?heure et demie\b|\b(an |one )?hour and a half\b/, 90],
  [/\bdemi[- ]heure\b|\bhalf an hour\b/, 30],
  [/\bquart d'heure\b|\bquarter of an hour\b/, 15],
  [/\btrois heures\b|\bthree hours\b/, 180],
  [/\bdeux heures\b|\btwo hours\b/, 120],
  [/\bune heure\b|\b(an|one) hour\b/, 60],
];

function duree(t: string): number | undefined {
  // « 2 h », « 1h30 », « 1 h 30 min », « 1.5 hours », « 2 heures »
  // (?![a-z]) plutôt que \b : dans « 1h30 », rien ne sépare « h » de « 30 ».
  const heures = t.match(/(\d+(?:[.,]\d+)?)\s*(?:h|heures?|hours?|hrs?)(?![a-z])\s*(\d{1,2})?/);
  // « 90 min », « 45 minutes »
  const minutes = t.match(/(\d+)\s*(?:min|mn|minutes?)\b/);
  let total: number | undefined;
  if (heures) {
    total = Math.round(Number(heures[1]!.replace(',', '.')) * 60) + Number(heures[2] ?? 0);
  } else if (minutes) {
    total = Number(minutes[1]);
  } else {
    total = DUREES_EN_LETTRES.find(([motif]) => motif.test(t))?.[1];
  }
  return total === undefined ? undefined : Math.min(DUREE_MAX, Math.max(DUREE_MIN, total));
}

function budget(t: string): number | undefined {
  if (/\b(gratuit\w*|free|sans payer|pas d'argent|no money)\b/.test(t)) return 0;
  // Un nombre n'est un budget que s'il porte une devise ou suit le mot « budget ».
  const montant =
    t.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:€|eur\b|euros?\b)/) ??
    t.match(/€\s*(\d+(?:[.,]\d{1,2})?)/) ??
    t.match(/\bbudget\D{0,12}(\d+(?:[.,]\d{1,2})?)/);
  return montant ? Number(montant[1]!.replace(',', '.')) : undefined;
}

export const heuristiqueLocale: ClientInterpretation = {
  async interpreter(texte) {
    const t = sansAccents(texte);
    const resultat: Interpretation = { categories: categoriesMentionnees(t) };
    const minutes = duree(t);
    if (minutes !== undefined) resultat.tempsLibreMinutes = minutes;
    const euros = budget(t);
    if (euros !== undefined) resultat.budgetMax = euros;
    return resultat;
  },
};

export const clientInterpretation: ClientInterpretation = heuristiqueLocale;
