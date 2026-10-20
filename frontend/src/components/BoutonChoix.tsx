import { Pressable, Text, StyleSheet } from 'react-native';
import { couleurs, polices } from '../theme';

type Props = {
  libelle: string;
  selectionne: boolean;
  onPress: () => void;
  multiple?: boolean;
};

export default function BoutonChoix({ libelle, selectionne, onPress, multiple = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={multiple ? 'checkbox' : 'radio'}
      accessibilityState={multiple ? { checked: selectionne } : { selected: selectionne }}
      style={[styles.bouton, selectionne && styles.selectionne]}
    >
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
    justifyContent: 'center',
    marginBottom: 12,
  },
  selectionne: { backgroundColor: couleurs.primaire },
  texte: { fontFamily: polices.texteMoyen, fontSize: 18, color: couleurs.texte },
  texteSelectionne: { color: couleurs.fond },
});