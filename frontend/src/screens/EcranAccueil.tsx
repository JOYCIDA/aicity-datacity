import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import AiCityLogo from '../components/AiCityLogo';
import CitySkyline from '../components/CitySkyline';
import { ICONES_CATEGORIE } from '../components/Icones';
import { sombre, polices, rayons, tailles } from '../theme';
import { useTextes } from '../i18n';
import { Choix } from '../types/questions';

type Props = {
  categories: Choix<string>[] | null; // null tant que les questions ne sont pas chargées
  onRaccourci: (categorie: string) => void;
  onCommencer: () => void;
};

export default function EcranAccueil({ categories, onRaccourci, onCommencer }: Props) {
  const t = useTextes();
  // Sur téléphone, un logo plus petit laisse le bouton Commencer visible sans défiler.
  const petitEcran = useWindowDimensions().width < 600;

  return (
    <View style={styles.ecran}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.centre}>
          <AiCityLogo size={petitEcran ? 'md' : 'lg'} dark />
          <Text style={styles.accroche}>{t.accueil.accroche}</Text>
        </View>

        {categories && (
          <View style={styles.raccourcis}>
            <Text accessibilityRole="header" style={styles.question}>
              {t.accueil.queCherchesTu}
            </Text>
            <View style={styles.tuiles}>
              {categories.map((c) => {
                const Icone = ICONES_CATEGORIE[c.valeur];
                return (
                  <Pressable
                    key={c.valeur}
                    onPress={() => onRaccourci(c.valeur)}
                    accessibilityRole="button"
                    accessibilityLabel={t.accueil.raccourciA11y(c.libelle)}
                    style={({ pressed }) => [styles.tuile, !petitEcran && styles.tuileLarge, pressed && styles.tuileAppuyee]}
                  >
                    {Icone && <Icone size={26} color={sombre.texte} strokeWidth={1.75} />}
                    <Text style={styles.tuileTexte}>{c.libelle}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <Pressable
          onPress={onCommencer}
          accessibilityRole="button"
          accessibilityLabel={t.accueil.commencer}
          style={styles.bouton}
        >
          <Text style={styles.boutonTexte}>{t.accueil.commencer}</Text>
        </Pressable>

        <Text style={styles.mention}>{t.accueil.mention}</Text>
      </ScrollView>

      <CitySkyline />
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: sombre.fond },
  page: { flexGrow: 1, padding: 16, gap: 20, justifyContent: 'center' },
  centre: { alignItems: 'center', gap: 12 },
  accroche: {
    fontFamily: polices.texte,
    color: sombre.texteSecondaire,
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'center',
    maxWidth: 420,
  },
  raccourcis: { alignItems: 'center', gap: 12 },
  question: {
    fontFamily: polices.texteMoyen,
    color: sombre.texteSecondaire,
    fontSize: tailles.texte,
  },
  // 6 tuiles sur une ligne sur grand écran (6 × 132 + 5 × 8), 3 + 3 sur téléphone : jamais de tuile isolée.
  tuiles: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, maxWidth: 840 },
  tuile: {
    width: 112,
    minHeight: 88,
    borderRadius: rayons.s,
    backgroundColor: sombre.carte,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tuileLarge: { width: 132, minHeight: 100 },
  tuileAppuyee: { backgroundColor: '#14506A' },
  tuileTexte: { fontFamily: polices.texteMoyen, color: sombre.texte, fontSize: tailles.texte, textAlign: 'center' },
  bouton: {
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
    minHeight: 64,
    borderRadius: rayons.s,
    backgroundColor: sombre.primaire,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boutonTexte: { fontFamily: polices.titre, color: sombre.surPrimaire, fontSize: 22 },
  mention: {
    fontFamily: polices.texte,
    color: sombre.texteSecondaire,
    fontSize: tailles.texte,
    textAlign: 'center',
  },
});
