import { View, Text, Pressable, StyleSheet } from 'react-native';
import { couleurs, polices, tailles } from '../theme';

type Props = {
  onCommencer: () => void;
};

export default function EcranAccueil({ onCommencer }: Props) {
  return (
    <View style={styles.page}>
      <View style={styles.centre}>
        <Text accessibilityRole="header" style={styles.logo}>
          <Text style={{ color: couleurs.texte }}>Ai</Text>
          <Text style={{ color: couleurs.primaire }}>City</Text>
        </Text>
        <Text style={styles.slogan}>FROM A TO B</Text>

        <Text style={styles.accroche}>
          Trouve une activité près de toi en moins de 2 minutes.
        </Text>
      </View>

      <Pressable
        onPress={onCommencer}
        accessibilityRole="button"
        accessibilityLabel="Commencer"
        style={styles.bouton}
      >
        <Text style={styles.boutonTexte}>Commencer</Text>
      </Pressable>

      <Text style={styles.mention}>
        Aucun compte. Aucune inscription. Session effacée à la fin.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 24 },
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