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

// ——— Nouvelle direction visuelle (pilote : écran fiche) ———
// Une seule famille, peu de tailles, la hiérarchie vient de la taille et de la graisse ;
// la couleur d'accent est réservée à l'action principale.
export const typo = {
  normal: 'InstrumentSans_400Regular',
  moyen: 'InstrumentSans_500Medium',
  fort: 'InstrumentSans_600SemiBold',
};

export const clair = {
  fond: '#FFFDF8',
  encre: '#0B2530', // texte principal (15,6:1 sur le fond)
  secondaire: '#52656C', // texte secondaire (6:1 sur le fond)
  trait: '#E2E8EA',
  surface: '#F3F6F6',
  accent: '#42A8B7', // action principale, avec texte encre (5,7:1)
};
