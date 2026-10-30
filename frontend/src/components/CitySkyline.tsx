import { StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '../theme/tokens';

type Immeuble = { x: number; l: number; h: number; toit: 'plat' | 'pointe' | 'antenne' };

// Générateur pseudo-aléatoire à graine fixe : la même silhouette à chaque affichage.
function graine(n: number) {
  let s = n;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function rangee(seed: number, hMin: number, hMax: number): Immeuble[] {
  const alea = graine(seed);
  const liste: Immeuble[] = [];
  for (let x = 0; x < 1440; ) {
    const l = 18 + Math.round(alea() * 34);
    const t = alea();
    liste.push({ x, l, h: hMin + Math.round(alea() * (hMax - hMin)), toit: t < 0.15 ? 'pointe' : t < 0.25 ? 'antenne' : 'plat' });
    x += l + 2 + Math.round(alea() * 4);
  }
  return liste;
}

// Deux plans : un fond haut et pâle, un premier plan plus bas et plus net (effet de profondeur).
const FOND = rangee(7, 40, 104);
const PREMIER_PLAN = rangee(23, 16, 64);
const H = 120;

function dessin(b: Immeuble) {
  const haut = H - b.h;
  if (b.toit === 'pointe') {
    return `M${b.x} ${H}V${haut}L${b.x + b.l / 2} ${haut - 12}L${b.x + b.l} ${haut}V${H}Z`;
  }
  return `M${b.x} ${H}V${haut}H${b.x + b.l}V${H}Z`;
}

export default function CitySkyline() {
  return (
    <View style={styles.container} pointerEvents="none" accessible={false}>
      <Svg viewBox={`0 0 1440 ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMax slice">
        {FOND.map((b) => (
          <Path key={`f${b.x}`} d={dessin(b)} fill={colors.teal} opacity={0.07} />
        ))}
        {FOND.filter((b) => b.toit === 'antenne').map((b) => (
          <Rect key={`a${b.x}`} x={b.x + b.l / 2 - 1} y={H - b.h - 16} width={2} height={16} fill={colors.teal} opacity={0.07} />
        ))}
        {PREMIER_PLAN.map((b) => (
          <Path key={`p${b.x}`} d={dessin(b)} fill={colors.teal} opacity={0.13} />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 96,
    overflow: 'hidden',
  },
});
