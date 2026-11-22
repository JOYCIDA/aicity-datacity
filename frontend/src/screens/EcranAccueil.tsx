import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions, Linking, ActivityIndicator, type TextStyle } from 'react-native';
import { ArrowUpRight, Globe } from 'lucide-react-native';
import AiCityLogo from '../components/AiCityLogo';
import CitySkyline from '../components/CitySkyline';
import { ICONES_CATEGORIE } from '../components/Icones';
import { PRO_URL } from '../config';
import { modeEcran, sombre, polices, rayons, typo } from '../theme';
import { Langue, LANGUES, TEXTES, useTextes } from '../i18n';
import { Choix } from '../types/questions';

type Props = {
  categories: Choix<string>[] | null; // null tant que les questions ne sont pas chargées
  erreur: string | null; // chargement des questions échoué
  onReessayer: () => void;
  onRaccourci: (categorie: string) => void;
  langue: Langue;
  onLangue: (langue: Langue) => void;
};

// Écrit dans les deux langues : un touriste doit le reconnaître avant d'avoir changé de langue.
const TITRE_LANGUE = 'Langue · Language';

export default function EcranAccueil({ categories, erreur, onReessayer, onRaccourci, langue, onLangue }: Props) {
  const t = useTextes();
  // Sur téléphone, un logo plus petit laisse les envies visibles sans défiler.
  const { width, height } = useWindowDimensions();
  const petitEcran = width < 600;
  const borne = modeEcran(width, height) === 'borne';
  // Sur la borne (grand écran lu debout, à un mètre), tout l'accueil est agrandi pour remplir l'écran.
  const k = borne ? 1.6 : 1;
  const z = (n: number) => Math.round(n * k);
  const texte = (s: TextStyle): TextStyle | null =>
    borne && s.fontSize ? { fontSize: z(s.fontSize), lineHeight: z(s.lineHeight ?? s.fontSize * 1.3) } : null;

  return (
    <View style={styles.ecran}>
      <ScrollView contentContainerStyle={[styles.page, { gap: z(20) }]}>
        <View style={[styles.centre, { gap: z(12) }]}>
          <AiCityLogo size={petitEcran ? 'md' : 'lg'} echelle={k} dark />
          <Text style={[styles.accroche, texte(styles.accroche), { maxWidth: z(420) }]}>{t.accueil.accroche}</Text>
        </View>

        {/* Choix de langue en grand, avec le nom complet : le premier geste d'un visiteur étranger. */}
        <View style={[styles.langues, { gap: z(8) }]}>
          <View style={styles.languesTitre}>
            <Globe size={z(18)} color={sombre.texteSecondaire} strokeWidth={2} />
            <Text style={[styles.languesTitreTexte, texte(styles.languesTitreTexte)]}>{TITRE_LANGUE}</Text>
          </View>
          <View style={styles.languesChoix} accessibilityRole="radiogroup" accessibilityLabel={TITRE_LANGUE}>
            {LANGUES.map((l) => {
              const active = l === langue;
              return (
                <Pressable
                  key={l}
                  onPress={() => onLangue(l)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={TEXTES[l].nomLangue}
                  style={({ pressed }) => [
                    styles.langue,
                    { minWidth: z(132), minHeight: z(52) },
                    active && styles.langueActive,
                    pressed && !active && styles.tuileAppuyee,
                  ]}
                >
                  <Text style={[styles.langueTexte, texte(styles.langueTexte), active && styles.langueTexteActive]}>
                    {TEXTES[l].nomLangue}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {categories && (
          <View style={[styles.raccourcis, { gap: z(12) }]}>
            <Text accessibilityRole="header" style={[styles.question, texte(styles.question)]}>
              {t.accueil.queCherchesTu}
            </Text>
            {/* Borne : 3 grandes tuiles par ligne. */}
            <View style={[styles.tuiles, borne && { maxWidth: 3 * z(132) + 2 * z(8), gap: z(8) }]}>
              {categories.map((c) => {
                const Icone = ICONES_CATEGORIE[c.valeur];
                return (
                  <Pressable
                    key={c.valeur}
                    onPress={() => onRaccourci(c.valeur)}
                    accessibilityRole="button"
                    accessibilityLabel={t.accueil.raccourciA11y(c.libelle)}
                    style={({ pressed }) => [
                      styles.tuile,
                      !petitEcran && styles.tuileLarge,
                      borne && { width: z(132), minHeight: z(100), gap: z(6) },
                      pressed && styles.tuileAppuyee,
                    ]}
                  >
                    {Icone && <Icone size={z(26)} color={sombre.texte} strokeWidth={1.75} />}
                    <Text style={[styles.tuileTexte, texte(styles.tuileTexte)]}>{c.libelle}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Sans envies chargées, pas de parcours possible : on attend ou on propose de réessayer. */}
        {!categories && !erreur && <ActivityIndicator size="large" color={sombre.primaire} accessibilityLabel={t.chargementQuestions} />}
        {!categories && erreur && (
          <View style={styles.erreur} accessibilityLiveRegion="polite">
            <Text style={[styles.erreurTexte, texte(styles.erreurTexte)]}>{erreur}</Text>
            <Pressable
              onPress={onReessayer}
              accessibilityRole="button"
              style={({ pressed }) => [styles.bouton, pressed && { opacity: 0.85 }]}
            >
              <Text style={[styles.boutonTexte, texte(styles.boutonTexte)]}>{t.reessayer}</Text>
            </Pressable>
          </View>
        )}

        <Text style={[styles.mention, texte(styles.mention)]}>{t.accueil.mention}</Text>

        {/* Lien vers l'espace entreprise : pas sur la borne, où personne ne gère son établissement. */}
        {!borne && (
          <View style={styles.pro}>
            <Text style={styles.proTexte}>{t.accueil.entreprise}</Text>
            <Pressable
              onPress={() => Linking.openURL(PRO_URL).catch(() => {})}
              accessibilityRole="link"
              accessibilityLabel={t.accueil.espaceProA11y}
              hitSlop={8}
              style={({ pressed }) => [styles.proLien, pressed && styles.proLienAppuye]}
            >
              <Text style={styles.proLienTexte}>{t.accueil.espacePro}</Text>
              <ArrowUpRight size={16} color={sombre.texte} strokeWidth={2} />
            </Pressable>
          </View>
        )}
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
    ...typo.sousTitre,
    fontFamily: polices.texte,
    lineHeight: 28,
    color: sombre.texteSecondaire,
    textAlign: 'center',
    maxWidth: 420,
  },
  langues: { alignItems: 'center', gap: 8 },
  languesTitre: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  languesTitreTexte: { ...typo.corpsFort, color: sombre.texteSecondaire },
  languesChoix: { flexDirection: 'row', gap: 8, backgroundColor: sombre.carte, borderRadius: rayons.s, padding: 4 },
  langue: { minWidth: 132, minHeight: 52, paddingHorizontal: 16, borderRadius: rayons.s, alignItems: 'center', justifyContent: 'center' },
  langueActive: { backgroundColor: sombre.primaire },
  langueTexte: { ...typo.corpsFort, fontFamily: polices.titre, color: sombre.texte },
  langueTexteActive: { color: sombre.surPrimaire },
  erreur: { alignItems: 'center', gap: 12 },
  erreurTexte: { ...typo.corps, color: sombre.texte, textAlign: 'center', maxWidth: 420 },
  raccourcis: { alignItems: 'center', gap: 12 },
  question: { ...typo.corpsFort, color: sombre.texteSecondaire },
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
  tuileTexte: { ...typo.corpsFort, color: sombre.texte, textAlign: 'center' },
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
  boutonTexte: { ...typo.sousTitre, color: sombre.surPrimaire },
  mention: { ...typo.corps, color: sombre.texteSecondaire, textAlign: 'center' },
  pro: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', columnGap: 6 },
  proTexte: { ...typo.legende, color: sombre.texteSecondaire },
  // 44 px de haut : zone tactile suffisante pour un lien texte.
  proLien: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingHorizontal: 4, borderRadius: rayons.s },
  proLienAppuye: { backgroundColor: sombre.carte },
  proLienTexte: { ...typo.legende, fontFamily: polices.texteMoyen, color: sombre.texte, textDecorationLine: 'underline' },
});
