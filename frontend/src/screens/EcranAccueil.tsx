import { View, Text, Pressable, StyleSheet } from 'react-native';
import { couleurs, polices, tailles } from '../theme';
import { Langue, LANGUES, TEXTES, useLangue, useTextes } from '../i18n';

type Props = {
  onChangerLangue: (langue: Langue) => void;
  onCommencer: () => void;
};

export default function EcranAccueil({ onChangerLangue, onCommencer }: Props) {
  const t = useTextes();
  const langue = useLangue();

  return (
    <View style={styles.page}>
      <View style={styles.langues} accessibilityRole="radiogroup" accessibilityLabel={t.accueil.choixLangue}>
        {LANGUES.map((l) => (
          <Pressable
            key={l}
            onPress={() => onChangerLangue(l)}
            accessibilityRole="radio"
            accessibilityState={{ selected: l === langue }}
            accessibilityLabel={TEXTES[l].nomLangue}
            style={[styles.langue, l === langue && styles.langueActive]}
          >
            <Text style={[styles.langueTexte, l === langue && styles.langueTexteActive]}>{l}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.centre}>
        <Text accessibilityRole="header" style={styles.logo}>
          <Text style={{ color: couleurs.texte }}>Ai</Text>
          <Text style={{ color: couleurs.primaire }}>City</Text>
        </Text>
        <Text style={styles.slogan}>FROM A TO B</Text>

        <Text style={styles.accroche}>{t.accueil.accroche}</Text>
      </View>

      <Pressable
        onPress={onCommencer}
        accessibilityRole="button"
        accessibilityLabel={t.accueil.commencer}
        style={styles.bouton}
      >
        <Text style={styles.boutonTexte}>{t.accueil.commencer}</Text>
      </Pressable>

      <Text style={styles.mention}>{t.accueil.mention}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 24 },
  langues: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    gap: 4,
    padding: 4,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: couleurs.primaire,
  },
  langue: {
    minWidth: tailles.zoneMin + 8,
    minHeight: tailles.zoneMin,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langueActive: { backgroundColor: couleurs.primaire },
  langueTexte: { fontFamily: polices.texteMoyen, color: couleurs.texte, fontSize: tailles.texte },
  langueTexteActive: { color: couleurs.fond },
  centre: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo: { fontFamily: polices.titre, fontSize: 56 },
  slogan: {
    fontFamily: polices.texteMoyen,
    color: couleurs.primaire,
    fontSize: tailles.texte,
    letterSpacing: 3,
    marginTop: 4,
  },
  accroche: {
    fontFamily: polices.texte,
    color: couleurs.texteSecondaire,
    fontSize: 20,
    textAlign: 'center',
    marginTop: 32,
    maxWidth: 420,
  },
  bouton: {
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
    marginTop: 16,
  },
});
