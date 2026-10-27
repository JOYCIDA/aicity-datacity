// Barème de recommandation (analyse, section 7.2 : 9 points au maximum).
//
// ⚠ PROVISOIRE : la section 7.2 n'était pas disponible lors du lot L4. Ces poids et seuils
// sont une proposition validée en attendant le barème officiel ; tout se règle ici, le
// service de scoring n'en contient aucun.

export const BAREME = {
  /** Catégorie de l'offre parmi les envies du citoyen. */
  categorie: 3,
  /** Trajet à pied court (RG14) : points selon le premier seuil atteint. */
  proximite: [
    { maxMinutes: 10, points: 2 },
    { maxMinutes: 20, points: 1 },
  ],
  /** Prix : gratuit, ou au plus `fractionBudget` du budget déclaré. */
  prix: { gratuit: 2, sousFractionBudget: 1, fractionBudget: 0.5 },
  /** Offre déjà en cours, ou qui commence avant `dansMinutes` après l'arrivée sur place. */
  imminence: { points: 1, dansMinutes: 30 },
  /** Temps libre restant après trajet et activité. */
  marge: { points: 1, minMinutes: 15 },
} as const;

export const SCORE_MAX =
  BAREME.categorie +
  BAREME.proximite[0].points +
  BAREME.prix.gratuit +
  BAREME.imminence.points +
  BAREME.marge.points;

/** Nombre d'offres proposées, et seuil sous lequel le rayon est doublé une fois (RG12). */
export const NB_RESULTATS = 5;
export const SEUIL_ELARGISSEMENT = 3;
export const RAYON_DEFAUT_M = 1000;
