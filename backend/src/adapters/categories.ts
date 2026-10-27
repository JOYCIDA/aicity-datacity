// Rapprochement des mots-clés des sources avec les six catégories AiCity (seed).
// Les tables sont lues dans l'ordre : les catégories précises passent avant « culture »,
// et « loisirs » sert de catégorie par défaut.

export const CODES_CATEGORIES = ['culture', 'gastronomie', 'nature', 'sport', 'loisirs', 'shopping'] as const;
export type CodeCategorie = (typeof CODES_CATEGORIES)[number];

// Racines sans accents, comparées en début de mot (« expo » couvre « exposition »).
const RACINES: [CodeCategorie, string[]][] = [
  ['gastronomie', ['gourmand', 'gastronom', 'degustation', 'cuisine', 'culinaire', 'vins?\\b', 'oenolog', 'brunch', 'chocolat', 'fromage', 'food', 'restaurant', 'wine', 'tasting']],
  ['sport', ['sport', 'velo', 'bicyclette', 'running', 'course a pied', 'yoga', 'randonnee', 'natation', 'football', 'basket', 'tennis', 'fitness', 'escalade', 'roller', 'bike', 'cycling', 'run\\b', 'hik']],
  ['nature', ['nature', 'jardin', 'parc\\b', 'foret', 'botani', 'biodiversite', 'environnement', 'potager', 'ornitho', 'arbre', 'garden', 'park\\b', 'outdoor']],
  ['shopping', ['shopping', 'brocante', 'vide-grenier', 'vide grenier', 'braderie', 'puces', 'marche de noel', 'marche artisanal', 'boutique', 'soldes', 'shop', 'market', 'flea']],
  ['culture', ['concert', 'theatre', 'expo', 'spectacle', 'conference', 'litterature', 'histoire', 'danse', 'art', 'ecrans', 'cinema', 'film', 'photo', 'peinture', 'cirque', 'humour', 'bd\\b', 'street-art', 'festival', 'musique', 'musee', 'patrimoine', 'visite', 'lecture', 'sciences', 'opera', 'museum', 'exhibit', 'gallery', 'show\\b', 'music', 'movie', 'theater']],
  ['loisirs', ['loisir', 'atelier', 'enfant', 'famille', 'jeu', 'nuit', 'salon', 'kids', 'game', 'fun\\b']],
];

const TABLES = RACINES.map(([code, racines]) => [code, new RegExp(`\\b(${racines.join('|')})`)] as const);

export const sansAccents = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/’/g, "'").toLowerCase();

/** Toutes les catégories évoquées dans un texte libre, sans catégorie par défaut. */
export function categoriesMentionnees(texte: string): CodeCategorie[] {
  const t = sansAccents(texte);
  return TABLES.filter(([, motif]) => motif.test(t)).map(([code]) => code);
}

function chercher(texte: string): CodeCategorie | null {
  const t = sansAccents(texte);
  for (const [code, motif] of TABLES) if (motif.test(t)) return code;
  return null;
}

/** Catégorie déduite des mots-clés, puis du titre en secours, « loisirs » à défaut. */
export function categoriser(motsCles: readonly (string | null | undefined)[], titre?: string | null): CodeCategorie {
  const tags = motsCles.filter((m): m is string => !!m).join(' | ');
  return (tags && chercher(tags)) || (titre && chercher(titre)) || 'loisirs';
}
