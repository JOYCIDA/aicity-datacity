import { Bike, Image, Leaf, Music, Utensils, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, radius, textSize } from '../theme/tokens';
import type { Lang } from './LanguageSelector';

export type Category = 'music' | 'expo' | 'sport' | 'food' | 'nature';

const categories: Record<Category, { icon: LucideIcon; label: string; labelEn: string }> = {
  music: { icon: Music, label: 'Musique', labelEn: 'Music' },
  expo: { icon: Image, label: 'Expo & Art', labelEn: 'Art & Expo' },
  sport: { icon: Bike, label: 'Sport', labelEn: 'Sport' },
  food: { icon: Utensils, label: 'Food', labelEn: 'Food' },
  nature: { icon: Leaf, label: 'Nature', labelEn: 'Nature' },
};

type Props = {
  category: Category;
  active?: boolean;
  lang?: Lang;
  onPress?: () => void;
};

export default function CategoryPicto({ category, active = false, lang = 'FR', onPress }: Props) {
  const cat = categories[category];
  const Icon = cat.icon;
  const label = lang === 'EN' ? cat.labelEn : cat.label;
  const fg = active ? colors.night : colors.nightForeground;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.button, active ? styles.active : styles.inactive, pressed && styles.pressed]}
    >
      <Icon size={48} color={fg} />
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    borderRadius: radius.xl,
    padding: 24,
  },
  active: {
    backgroundColor: colors.teal,
  },
  inactive: {
    backgroundColor: colors.night,
    borderWidth: 2,
    borderColor: 'rgba(66, 168, 183, 0.3)',
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: textSize.base,
    textAlign: 'center',
  },
});
