import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { couleurs, polices, tailles } from '../theme';

type Props = {
  message: string; // affiché pendant le chargement
  erreur: string | null;
  onReessayer: () => void;
};

export default function EtatChargement({ message, erreur, onReessayer }: Props) {
  if (erreur) {
    return (
      <View>
        <View style={styles.erreur} accessibilityRole="alert">
          <Text style={styles.erreurIcone}>⚠</Text>
          <Text style={styles.erreurTexte}>{erreur}</Text>
        </View>
        <Pressable
          onPress={onReessayer}
          accessibilityRole="button"
          accessibilityLabel="Réessayer"
          style={styles.bouton}
        >
          <Text style={styles.boutonTexte}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.chargement} accessible accessibilityLabel={message}>
      <ActivityIndicator size="large" color={couleurs.primaire} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chargement: { alignItems: 'center', gap: 12, marginTop: 48 },
  message: { fontFamily: polices.texte, color: couleurs.texteSecondaire, fontSize: tailles.texte },
  erreur: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24 },
  erreurIcone: { color: couleurs.erreur, fontSize: 20 },
  erreurTexte: { flex: 1, fontFamily: polices.texteMoyen, color: couleurs.erreur, fontSize: tailles.texte },
  bouton: {
    alignSelf: 'flex-start',
    minHeight: tailles.zoneMin + 12,
    justifyContent: 'center',
    backgroundColor: couleurs.primaire,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginTop: 16,
  },
  boutonTexte: { fontFamily: polices.titre, color: couleurs.fond, fontSize: 20 },
});
