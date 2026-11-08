import { Check, type LucideIcon } from 'lucide-react-native';
import { Pressable, Text, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { couleurs, espace, rayons } from '../theme';
import { useDesign } from '../design';
import { vibrer } from '../animations';

type Props = {
  libelle: string;
  selectionne: boolean;
  onPress: () => void;
  multiple?: boolean;
  icone?: LucideIcon;
  style?: StyleProp<ViewStyle>;
};

// Choix unique : rond (bouton radio) ; choix multiple : case carrée (case à cocher).
export default function BoutonChoix({ libelle, selectionne, onPress, multiple = false, icone: Icone, style }: Props) {
  const d = useDesign();
  const taille = d.px(22);
  return (
    <Pressable
      onPress={() => {
        vibrer('choix');
        onPress();
      }}
      accessibilityRole={multiple ? 'checkbox' : 'radio'}
      accessibilityState={multiple ? { checked: selectionne } : { selected: selectionne }}
      accessibilityLabel={libelle}
      style={({ pressed }) => [
        styles.bouton,
        { minHeight: d.px(60), paddingHorizontal: d.px(18) },
        selectionne && styles.selectionne,
        pressed && styles.appuye,
        style,
      ]}
    >
      {Icone && <Icone size={d.px(22)} color={couleurs.texte} strokeWidth={1.75} />}
      <Text style={[d.typo('corpsFort'), styles.texte]}>{libelle}</Text>
      {/* La coche : la sélection ne repose pas que sur la couleur. */}
      <View
        style={[
          styles.coche,
          { width: taille, height: taille, borderRadius: multiple ? 6 : taille / 2 },
          selectionne && styles.cocheActive,
        ]}
      >
        {selectionne &&
          (multiple ? (
            <Check size={d.px(15)} color={couleurs.fond} strokeWidth={3} />
          ) : (
            <View style={[styles.point, { width: taille / 2.6, height: taille / 2.6, borderRadius: taille }]} />
          ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Bordure de 2 px dans les deux états : la sélection ne fait pas bouger le contenu.
  bouton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espace.m,
    borderRadius: rayons.s,
    borderWidth: 2,
    borderColor: couleurs.trait,
    backgroundColor: '#FFFFFF',
    marginBottom: espace.s,
  },
  selectionne: { borderColor: couleurs.texte, backgroundColor: couleurs.carte },
  appuye: { backgroundColor: couleurs.carte },
  texte: { flex: 1, color: couleurs.texte },
  coche: {
    borderWidth: 2,
    borderColor: couleurs.champ,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cocheActive: { backgroundColor: couleurs.texte, borderColor: couleurs.texte },
  point: { backgroundColor: couleurs.fond },
});
