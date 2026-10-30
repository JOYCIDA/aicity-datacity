import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, textSize } from '../theme/tokens';
import { useTextes } from '../i18n';
import AiCityLogo from './AiCityLogo';
import LanguageSelector, { type Lang } from './LanguageSelector';

type Props = {
  showBack?: boolean;
  showLogo?: boolean;
  dark?: boolean;
  lang: Lang;
  onLangChange?: (lang: Lang) => void;
  onBack?: () => void;
};

export default function KioskTopBar({
  showBack = false,
  showLogo = true,
  dark = true,
  lang,
  onLangChange,
  onBack,
}: Props) {
  const t = useTextes();
  const backColor = dark ? colors.nightForeground : colors.night;

  return (
    <View style={[styles.container, dark ? styles.dark : styles.light]}>
      <View style={styles.side}>
        {showBack && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.retour}
            onPress={onBack}
            style={[styles.back, { backgroundColor: dark ? colors.cardDark : colors.muted }]}
          >
            <ChevronLeft size={22} color={backColor} />
            <Text style={[styles.backLabel, { color: backColor }]}>{t.retour}</Text>
          </Pressable>
        )}
      </View>

      {showLogo && <AiCityLogo size="sm" dark={dark} />}

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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    flex: 1,
  },
  sideEnd: {
    alignItems: 'flex-end',
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    minHeight: 44,
    borderRadius: radius.xl,
    paddingHorizontal: 14,
  },
  backLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: textSize.sm,
  },
});
