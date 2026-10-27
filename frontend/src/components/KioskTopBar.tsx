import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, textSize } from '../theme/tokens';
import AiCityLogo from './AiCityLogo';
import LanguageSelector, { type Lang } from './LanguageSelector';

type Props = {
  showBack?: boolean;
  dark?: boolean;
  lang: Lang;
  onLangChange?: (lang: Lang) => void;
  onBack?: () => void;
};

export default function KioskTopBar({ showBack = false, dark = true, lang, onLangChange, onBack }: Props) {
  const backColor = dark ? colors.nightForeground : colors.night;

  return (
    <View style={[styles.container, dark ? styles.dark : styles.light]}>
      <View style={styles.side}>
        {showBack && (
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            style={[styles.back, { backgroundColor: dark ? colors.cardDark : colors.muted }]}
          >
            <ChevronLeft size={22} color={backColor} />
            <Text style={[styles.backLabel, { color: backColor }]}>Retour</Text>
          </Pressable>
        )}
      </View>

      <AiCityLogo size="sm" dark={dark} />

      <View style={[styles.side, styles.sideEnd]}>
        <LanguageSelector active={lang} onChange={onLangChange} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  dark: {
    backgroundColor: colors.night,
  },
  light: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  side: {
    minWidth: 120,
  },
  sideEnd: {
    alignItems: 'flex-end',
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    borderRadius: radius.xl,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: textSize.base,
  },
});
