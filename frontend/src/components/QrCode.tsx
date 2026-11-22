import { useMemo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { genererQr } from '../utils/qrcode';

type Props = {
  valeur: string;
  taille: number; // côté en pixels, marge blanche comprise
  accessibilityLabel: string;
};

// Marge blanche de 4 modules autour du code : exigée par la norme pour que les téléphones le lisent.
const MARGE = 4;

export default function QrCode({ valeur, taille, accessibilityLabel }: Props) {
  const { chemin, cote } = useMemo(() => {
    const grille = genererQr(valeur);
    let d = '';
    grille.forEach((ligne, y) =>
      ligne.forEach((noir, x) => {
        if (noir) d += `M${x + MARGE} ${y + MARGE}h1v1h-1z`;
      }),
    );
    return { chemin: d, cote: grille.length + MARGE * 2 };
  }, [valeur]);

  return (
    <Svg
      width={taille}
      height={taille}
      viewBox={`0 0 ${cote} ${cote}`}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {/* Toujours noir sur blanc, quel que soit le thème : c'est ce que les appareils photo lisent le mieux. */}
      <Rect width={cote} height={cote} fill="#FFFFFF" />
      <Path d={chemin} fill="#000000" />
    </Svg>
  );
}
