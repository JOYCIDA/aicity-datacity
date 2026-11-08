import { LogOut } from 'lucide-react-native';
import { Pressable, Text, StyleSheet } from 'react-native';
import { couleurs, rayons, tailles } from '../theme';
import { useTextes } from '../i18n';
import { useDesign } from '../design';

type Props = {
  onPress: () => void;
};

// Termine la session : efface les choix et affiche l'écran « Bonne découverte ! ».
export default function BoutonTerminer({ onPress }: Props) {
  const t = useTextes();
  const d = useDesign();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t.fin.terminerA11y}
      style={({ pressed }) => [
        styles.bouton,
        { minHeight: d.px(44), paddingHorizontal: d.px(16) },
        pressed && { backgroundColor: couleurs.carte },
      ]}
    >
      <LogOut size={d.px(18)} color={couleurs.texte} />
      <Text style={[d.typo('corpsFort'), styles.texte]}>{t.fin.terminer}</Text>
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
    borderRadius: rayons.s,
    borderWidth: 1,
    borderColor: couleurs.champ,
  },
  texte: { color: couleurs.texte },
});
