import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, textSize } from '../theme/tokens';
import { useTextes } from '../i18n';
import { useDesign } from '../design';
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
  const d = useDesign();
  const backColor = dark ? colors.nightForeground : colors.night;

  return (
    <View style={[styles.container, { minHeight: d.px(64), paddingHorizontal: d.marge }, dark ? styles.dark : styles.light]}>
      <View style={styles.side}>
        {showBack && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.retour}
            onPress={onBack}
            style={({ pressed }) => [
              styles.back,
              { minHeight: d.px(44), paddingHorizontal: d.px(14), backgroundColor: dark ? colors.cardDark : colors.muted },
              pressed && { opacity: 0.8 },
            ]}
          >
            <ChevronLeft size={d.px(22)} color={backColor} />
            <Text style={[styles.backLabel, { color: backColor, fontSize: d.texte.corps }]}>{t.retour}</Text>
          </Pressable>
        )}
      </View>

      {showLogo && <AiCityLogo compact echelle={d.px(100) / 100} dark={dark} />}

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
    paddingVertical: 8,
    minHeight: 64,
  },
  dark: {
    backgroundColor: colors.night,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(66, 168, 183, 0.18)',
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
