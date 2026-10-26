import { CirclePlay } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AiCityLogo from '../components/AiCityLogo';
import CategoryPicto, { type Category } from '../components/CategoryPicto';
import CitySkyline from '../components/CitySkyline';
import KioskTopBar from '../components/KioskTopBar';
import type { Lang } from '../components/LanguageSelector';
import { colors, fonts, radius, textSize } from '../theme/tokens';

const categories: Category[] = ['music', 'expo', 'sport', 'food', 'nature'];

type Props = {
  onStart?: () => void;
};

export default function AccueilScreen({ onStart }: Props) {
  const [lang, setLang] = useState<Lang>('FR');

  return (
    <SafeAreaView style={styles.screen}>
      <KioskTopBar dark lang={lang} onLangChange={setLang} />

      <ScrollView contentContainerStyle={styles.hero}>
        <View style={styles.intro}>
          <AiCityLogo size="lg" dark />
          <Text style={styles.subtitle}>Trouve une activité près de toi en moins de 2 minutes.</Text>
        </View>

        <View style={styles.categoriesBlock}>
          <Text style={styles.question}>Que cherches-tu ?</Text>
          <View style={styles.categories}>
            {categories.map((cat) => (
              <CategoryPicto key={cat} category={cat} lang={lang} />
            ))}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onStart}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <CirclePlay size={40} color={colors.night} />
          <Text style={styles.ctaLabel}>Commencer</Text>
        </Pressable>

        <Text style={styles.tagline}>Aucun compte. Aucune inscription. Session effacée à la fin.</Text>
      </ScrollView>

      <CitySkyline />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.night,
  },
  hero: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    gap: 40,
  },
  intro: {
    alignItems: 'center',
    gap: 12,
  },
  subtitle: {
    marginTop: 8,
    maxWidth: 576,
    fontFamily: fonts.body,
    fontSize: textSize.lg,
    color: colors.nightForeground,
    opacity: 0.6,
    textAlign: 'center',
  },
  categoriesBlock: {
    alignItems: 'center',
    gap: 24,
  },
  question: {
    fontFamily: fonts.body,
    fontSize: textSize.base,
    color: colors.nightForeground,
    opacity: 0.5,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 96,
    marginTop: 8,
    paddingHorizontal: 64,
    paddingVertical: 28,
    borderRadius: radius.xl,
    backgroundColor: colors.teal,
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaLabel: {
    fontFamily: fonts.headingsBold,
    fontSize: textSize['2xl'],
    color: colors.night,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: textSize.sm,
    color: colors.nightForeground,
    opacity: 0.3,
    textAlign: 'center',
  },
});
