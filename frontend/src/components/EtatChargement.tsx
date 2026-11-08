import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { couleurs, tailles, typo } from '../theme';
import { useTextes } from '../i18n';
import { Message } from '../design';

type Props = {
  message: string; // affiché pendant le chargement
  erreur: string | null;
  onReessayer: () => void;
};

export default function EtatChargement({ message, erreur, onReessayer }: Props) {
  const t = useTextes();
  if (erreur) {
    return (
      <View>
        <Message type="erreur" texte={erreur} />
        <Pressable
          onPress={onReessayer}
          accessibilityRole="button"
          accessibilityLabel={t.reessayer}
          style={styles.bouton}
        >
          <Text style={styles.boutonTexte}>{t.reessayer}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.chargement} accessible accessibilityLabel={message}>
      <ActivityIndicator size="large" color={couleurs.lien} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chargement: { alignItems: 'center', gap: 12, marginTop: 48 },
  message: { ...typo.corps, color: couleurs.texteSecondaire },
  bouton: {
    alignSelf: 'flex-start',
    minHeight: tailles.zoneMin + 12,
    justifyContent: 'center',
    backgroundColor: couleurs.primaire,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 16,
  },
  boutonTexte: { ...typo.sousTitre, color: couleurs.surPrimaire },
});
