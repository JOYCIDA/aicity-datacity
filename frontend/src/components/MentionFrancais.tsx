import { Languages } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/tokens';
import { polices, typo } from '../theme';
import { useTextes } from '../i18n';

// Petite mention « FR » quand l'anglais est demandé mais que l'offre n'est pas encore traduite.
export default function MentionFrancais() {
  const t = useTextes();
  return (
    <View style={styles.mention} accessible accessibilityLabel={t.contenuFrancais}>
      <Languages size={14} color={colors.night} />
      <Text style={styles.texte}>FR</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mention: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  texte: { ...typo.legende, fontFamily: polices.texteMoyen, color: colors.night },
});
