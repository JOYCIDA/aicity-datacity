// Écrans de contenu (questions, résultats, fiche) : fond clair. La couleur d'accent est réservée
// à l'action principale et à la sélection ; la hiérarchie vient de la taille et de la graisse.
export const couleurs = {
  fond: '#FFFDF8',
  texte: '#0B2530', // 15,6:1 sur le fond
  texteSecondaire: '#52656C', // 6:1 sur le fond, 5,6:1 sur `carte`
  primaire: '#42A8B7', // fond des boutons principaux (jamais en texte : 2,8:1)
  surPrimaire: '#0B2530', // texte posé sur `primaire` (5,7:1)
  lien: '#1F6F7C', // accent en texte ou en icône (5,7:1)
  carte: '#F3F6F6', // surfaces légères
  trait: '#E2E8EA', // séparateurs
  champ: '#7E8F95', // bordure des champs et des cases (3,3:1)
  erreur: '#B42318', // 6,5:1
};

// Écrans d'accueil et de fin (vitrine de la borne) : fond nuit de la maquette.
export const sombre = {
  fond: '#082B38',
  texte: '#FFFDF8',
  texteSecondaire: 'rgba(255,253,248,0.75)', // 8,8:1
  primaire: '#42A8B7',
  surPrimaire: '#082B38', // 5,3:1
  carte: '#0D3C4F', // 11,6:1 avec le texte
};

// Une seule famille ; en React Native chaque graisse est une police distincte (chargée dans App.tsx).
export const polices = {
  titre: 'InstrumentSans_600SemiBold',
  texte: 'InstrumentSans_400Regular',
  texteMoyen: 'InstrumentSans_500Medium',
};

// Échelle typographique : six styles, et rien d'autre. Interlignes sur une grille de 4 px.
// Valeurs téléphone ; `useDesign().typo` agrandit affiche et titre sur ordinateur, et tout sur la borne.
export type NomTexte = 'affiche' | 'titre' | 'sousTitre' | 'corps' | 'corpsFort' | 'legende';
type SpecTexte = { fontFamily: string; fontSize: number; lineHeight: number; letterSpacing: number };

export const typo: Record<NomTexte, SpecTexte> = {
  affiche: { fontFamily: polices.titre, fontSize: 32, lineHeight: 38, letterSpacing: -0.6 },
  titre: { fontFamily: polices.titre, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  sousTitre: { fontFamily: polices.titre, fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  corps: { fontFamily: polices.texte, fontSize: 16, lineHeight: 24, letterSpacing: 0 },
  corpsFort: { fontFamily: polices.texteMoyen, fontSize: 16, lineHeight: 24, letterSpacing: 0 },
  legende: { fontFamily: polices.texte, fontSize: 14, lineHeight: 20, letterSpacing: 0 },
};

// Sur grand écran, seuls les deux plus grands styles grandissent.
export const typoGrandEcran: Partial<Record<NomTexte, Partial<SpecTexte>>> = {
  affiche: { fontSize: 40, lineHeight: 48, letterSpacing: -0.8 },
  titre: { fontSize: 28, lineHeight: 36, letterSpacing: -0.5 },
};

// Largeur de lecture confortable d'un paragraphe (environ 70 caractères en corps 16).
export const LARGEUR_LECTURE = 680;

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
