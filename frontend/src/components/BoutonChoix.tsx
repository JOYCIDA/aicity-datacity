import { Pressable, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { couleurs, polices } from '../theme';

type Props = {
  libelle: string;
  selectionne: boolean;
  onPress: () => void;
  multiple?: boolean;
  icone?: LucideIcon;
  style?: StyleProp<ViewStyle>;
};

export default function BoutonChoix({ libelle, selectionne, onPress, multiple = false, icone: Icone, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={multiple ? 'checkbox' : 'radio'}
      accessibilityState={multiple ? { checked: selectionne } : { selected: selectionne }}
      accessibilityLabel={libelle}
      style={[styles.bouton, selectionne && styles.selectionne, style]}
    >
      {Icone && <Icone size={22} color={selectionne ? couleurs.fond : couleurs.texte} />}
      <Text style={[styles.texte, selectionne && styles.texteSelectionne]}>
        {libelle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bouton: {
    minHeight: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: couleurs.primaire,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  selectionne: { backgroundColor: couleurs.primaire },
  texte: { flexShrink: 1, fontFamily: polices.texteMoyen, fontSize: 18, color: couleurs.texte },
  texteSelectionne: { color: couleurs.fond },
});
