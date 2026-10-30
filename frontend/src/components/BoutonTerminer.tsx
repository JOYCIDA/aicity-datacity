import { LogOut } from 'lucide-react-native';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/tokens';
import { polices, tailles } from '../theme';
import { useTextes } from '../i18n';
import { useDesign } from '../design';

type Props = {
  onPress: () => void;
  clair?: boolean; // sur fond clair (fiche) plutôt que sur fond foncé
};

// Termine la session : efface les choix et affiche l'écran « Bonne découverte ! ».
export default function BoutonTerminer({ onPress, clair = false }: Props) {
  const t = useTextes();
  const d = useDesign();
  const couleur = clair ? colors.night : colors.nightForeground;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t.fin.terminerA11y}
      style={({ pressed }) => [
        styles.bouton,
        { minHeight: d.px(44), paddingHorizontal: d.px(18), borderColor: clair ? colors.night : colors.teal },
        pressed && { opacity: 0.8 },
      ]}
    >
      <LogOut size={d.px(20)} color={couleur} />
      <Text style={[styles.texte, { color: couleur, fontSize: d.texte.corps }]}>{t.fin.terminer}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bouton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    minHeight: tailles.zoneMin,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 2,
  },
  texte: { fontFamily: polices.texteMoyen, fontSize: tailles.texte },
});
