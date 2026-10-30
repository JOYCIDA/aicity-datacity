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

// Mots du langage courant, utilisés seulement pour interpréter une demande (« manger un bon
// resto »). Ils sont trop larges pour classer un événement : « café-théâtre » n'est pas de la
// gastronomie. L'import n'utilise donc que RACINES.
const RACINES_DEMANDE: Partial<Record<CodeCategorie, string[]>> = {
  gastronomie: ['resto', 'manger', 'mange', 'repas', 'dejeuner', 'diner', 'souper', 'gouter', 'bistro', 'brasserie', 'cafe', 'bar\\b', 'boire', 'boisson', 'glace', 'patisserie', 'boulangerie', 'pizza', 'burger', 'sushi', 'dessert', 'snack', 'eat\\b', 'lunch', 'dinner', 'coffee', 'drink'],
  sport: ['bouger', 'courir', 'nager', 'pedaler', 'muscu', 'gym\\b', 'piscine', 'foot\\b', 'cycl', 'work-?out', 'swim'],
  nature: ['balade', 'promenade', 'se promener', 'pique-?nique', 'lac\\b', 'canal', 'berges?\\b', 'plein air', 'verdure', 'fleur', 'walk\\b', 'stroll', 'picnic', 'fresh air'],
  loisirs: ['amuser', 'divertir', 'bowling', 'karting', 'escape', 'laser', 'billard', 'jouer', 'entertain'],
  shopping: ['acheter', 'magasin', 'courses\\b', 'buy\\b', 'store\\b'],
};

const TABLES = RACINES.map(([code, racines]) => [code, new RegExp(`\\b(${racines.join('|')})`)] as const);

export const sansAccents = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/’/g, "'").toLowerCase();

const TABLES_DEMANDE = RACINES.map(
  ([code, racines]) => [code, new RegExp(`\\b(${[...racines, ...(RACINES_DEMANDE[code] ?? [])].join('|')})`)] as const,
);

/** Toutes les catégories évoquées dans un texte libre, sans catégorie par défaut. */
export function categoriesMentionnees(texte: string): CodeCategorie[] {
  const t = sansAccents(texte);
  return TABLES_DEMANDE.filter(([, motif]) => motif.test(t)).map(([code]) => code);
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
