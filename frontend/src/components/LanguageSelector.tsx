import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, textSize } from '../theme/tokens';
import { Langue, LANGUES, TEXTES, useTextes } from '../i18n';

export type Lang = Langue;

type Props = {
  active: Lang;
  onChange?: (lang: Lang) => void;
};

export default function LanguageSelector({ active, onChange }: Props) {
  const t = useTextes();
  return (
    <View style={styles.container} accessibilityRole="radiogroup" accessibilityLabel={t.accueil.choixLangue}>
      {LANGUES.map((lang) => {
        const isActive = lang === active;
        return (
          <Pressable
            key={lang}
            accessibilityRole="radio"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={TEXTES[lang].nomLangue}
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
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
