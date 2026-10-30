export const couleurs = {
  fond: '#082B38',
  primaire: '#42A8B7',
  texte: '#FFFDF8',
  texteSecondaire: 'rgba(255,253,248,0.75)', // lisible sur le fond (8,8:1)
  carte: '#0D3C4F', // cardDark de la maquette (theme/tokens.ts)
  barreInactive: '#5A8FA0',
  erreur: '#FFB4A8',
};

export const polices = {
  titre: 'SpaceGrotesk_700Bold',
  texte: 'DMSans_400Regular',
  texteMoyen: 'DMSans_500Medium',
};

export const tailles = {
  texte: 16, // texte courant (accessibilité)
  petit: 14, // surtitres seulement
  zoneMin: 44, // zone cliquable minimale
};
// ——— Système de design ———
// Une seule échelle d'espacements et de textes pour tous les écrans. Sur la borne (grand écran
// vertical lu à distance), tout est agrandi par `facteur`.

export const espace = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const rayons = { s: 12, m: 16, l: 24, pilule: 999 } as const;

export type Mode = 'telephone' | 'bureau' | 'borne';

export function modeEcran(largeur: number, hauteur: number): Mode {
  if (hauteur >= 1400 && hauteur > largeur) return 'borne';
  return largeur >= 900 ? 'bureau' : 'telephone';
}
