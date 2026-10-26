export function formaterPrix(prix: number): string {
  return prix === 0 ? 'Gratuit' : `${prix} €`;
}

export function formaterDistance(metres: number): string {
  if (metres < 1000) return `${metres} m`;
  return `${(metres / 1000).toFixed(1).replace('.', ',')} km`;
}

export const LIBELLES_CATEGORIE = {
  musique: 'Musique',
  expos: 'Expo & Art',
  sport: 'Sport',
  food: 'Food',
  nature: 'Nature',
  autre: 'Autre',
} as const;