import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors, fonts, textSize } from '../theme/tokens';

type Size = 'sm' | 'md' | 'lg';

const sizes = {
  sm: { icon: 40, title: textSize.xl, slogan: textSize.sm },
  md: { icon: 64, title: textSize['2xl'], slogan: textSize.base },
  lg: { icon: 96, title: textSize['3xl'], slogan: textSize.lg },
} as const;

type Props = {
  size?: Size;
  dark?: boolean;
  compact?: boolean; // sur une ligne, sans slogan (barre du haut)
  echelle?: number; // agrandissement de la version compacte (borne)
};

export default function AiCityLogo({ size = 'md', dark = false, compact = false, echelle = 1 }: Props) {
  const s = compact ? { icon: 30 * echelle, title: 22 * echelle, slogan: 0 } : sizes[size];
  const textColor = dark ? colors.nightForeground : colors.night;

  return (
    <View style={[styles.container, compact && styles.compact]} accessible accessibilityRole={compact ? 'image' : 'header'} accessibilityLabel="AiCity">
      {/* Skyline + circuit */}
      <Svg viewBox="0 0 80 80" width={s.icon} height={s.icon} fill="none">
        <Rect x="6" y="38" width="12" height="28" rx="2" fill={colors.teal} />
        <Rect x="20" y="26" width="10" height="40" rx="2" fill={colors.teal} />
        <Rect x="32" y="18" width="16" height="48" rx="2" fill={colors.night} stroke={colors.teal} strokeWidth="2" />
        <Rect x="50" y="30" width="10" height="36" rx="2" fill={colors.teal} />
        <Rect x="62" y="42" width="12" height="24" rx="2" fill={colors.teal} />
        <Path
          d="M12 30 L12 22 L26 22 L26 16 L40 16 L40 10 L55 10 L55 22 L68 22 L68 34"
          stroke={colors.teal}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Circle cx="12" cy="30" r="3" fill={colors.cream} stroke={colors.teal} strokeWidth="2" />
        <Circle cx="40" cy="10" r="3" fill={colors.cream} stroke={colors.teal} strokeWidth="2" />
        <Circle cx="68" cy="34" r="3" fill={colors.cream} stroke={colors.teal} strokeWidth="2" />
      </Svg>

      <Text style={[styles.title, { fontSize: s.title, color: textColor }]}>
        Ai<Text style={styles.accent}>City</Text>
      </Text>

      {!compact && <Text style={[styles.slogan, { fontSize: s.slogan }]}>From A to B</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  compact: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    fontFamily: fonts.headingsBold,
    letterSpacing: -0.5,
  },
  accent: {
    color: colors.teal,
  },
  slogan: {
    fontFamily: fonts.bodyMedium,
    color: colors.teal,
    opacity: 0.8,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
