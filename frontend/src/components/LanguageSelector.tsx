import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, textSize } from '../theme/tokens';

export type Lang = 'FR' | 'EN';

const languages: Lang[] = ['FR', 'EN'];

type Props = {
  active: Lang;
  onChange?: (lang: Lang) => void;
};

export default function LanguageSelector({ active, onChange }: Props) {
  return (
    <View style={styles.container}>
      {languages.map((lang) => {
        const isActive = lang === active;
        return (
          <Pressable
            key={lang}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange?.(lang)}
            style={[styles.option, isActive && styles.optionActive]}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{lang}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.cardDark,
    borderRadius: radius.xl,
    padding: 4,
    gap: 4,
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.xl,
  },
  optionActive: {
    backgroundColor: colors.teal,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: textSize.sm,
    color: colors.nightForeground,
  },
  labelActive: {
    color: colors.night,
  },
});
