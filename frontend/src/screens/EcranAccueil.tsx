import { CirclePlay } from 'lucide-react-native';
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import AiCityLogo from '../components/AiCityLogo';
import CitySkyline from '../components/CitySkyline';
import { ICONES_CATEGORIE } from '../components/Icones';
import { couleurs, polices, tailles } from '../theme';
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
                    style={({ pressed }) => [styles.tuile, pressed && styles.tuileAppuyee]}
                  >
                    {Icone && <Icone size={28} color={couleurs.texte} />}
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
          <CirclePlay size={30} color={couleurs.fond} />
          <Text style={styles.boutonTexte}>{t.accueil.commencer}</Text>
        </Pressable>

        <Text style={styles.mention}>{t.accueil.mention}</Text>
      </ScrollView>

      <CitySkyline />
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  page: { flexGrow: 1, padding: 16, gap: 20, justifyContent: 'center' },
  centre: { alignItems: 'center', gap: 12 },
  accroche: {
    fontFamily: polices.texte,
    color: couleurs.texteSecondaire,
    fontSize: 20,
    textAlign: 'center',
    maxWidth: 420,
  },
  raccourcis: { alignItems: 'center', gap: 12 },
  question: {
    fontFamily: polices.texteMoyen,
    color: couleurs.texteSecondaire,
    fontSize: tailles.texte,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  tuiles: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, maxWidth: 720 },
  tuile: {
    width: 112,
    minHeight: 88,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: couleurs.primaire,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tuileAppuyee: { backgroundColor: couleurs.carte },
  tuileTexte: { fontFamily: polices.texteMoyen, color: couleurs.texte, fontSize: tailles.texte, textAlign: 'center' },
  bouton: {
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
    minHeight: 64,
    borderRadius: 32,
    backgroundColor: couleurs.primaire,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boutonTexte: { fontFamily: polices.titre, color: couleurs.fond, fontSize: 24 },
  mention: {
    fontFamily: polices.texte,
    color: couleurs.texteSecondaire,
    fontSize: tailles.texte,
    textAlign: 'center',
  },
});
