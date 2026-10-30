import { Check, type LucideIcon } from 'lucide-react-native';
import { Pressable, Text, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { couleurs, espace, polices, rayons } from '../theme';
import { useDesign } from '../design';

type Props = {
  libelle: string;
  selectionne: boolean;
  onPress: () => void;
  multiple?: boolean;
  icone?: LucideIcon;
  style?: StyleProp<ViewStyle>;
};

export default function BoutonChoix({ libelle, selectionne, onPress, multiple = false, icone: Icone, style }: Props) {
  const d = useDesign();
  const couleur = selectionne ? couleurs.fond : couleurs.texte;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={multiple ? 'checkbox' : 'radio'}
      accessibilityState={multiple ? { checked: selectionne } : { selected: selectionne }}
      accessibilityLabel={libelle}
      style={({ pressed }) => [
        styles.bouton,
        { minHeight: d.px(60), paddingHorizontal: d.px(20) },
        selectionne && styles.selectionne,
        pressed && styles.appuye,
        style,
      ]}
    >
      {Icone && <Icone size={d.px(22)} color={couleur} />}
      <Text style={[styles.texte, { fontSize: d.texte.choix, color: couleur }]}>{libelle}</Text>
      {/* Coche : la sélection ne repose pas que sur la couleur. */}
      <View style={[styles.coche, { width: d.px(24), height: d.px(24) }, selectionne && styles.cocheActive]}>
        {selectionne && <Check size={d.px(16)} color={couleurs.primaire} strokeWidth={3} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bouton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espace.m,
    borderRadius: rayons.pilule,
    borderWidth: 2,
    borderColor: 'rgba(66, 168, 183, 0.55)',
    marginBottom: espace.m,
  },
  selectionne: { backgroundColor: couleurs.primaire, borderColor: couleurs.primaire },
  appuye: { transform: [{ scale: 0.985 }], opacity: 0.9 },
  texte: { flex: 1, fontFamily: polices.texteMoyen },
  coche: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255, 253, 248, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cocheActive: { backgroundColor: couleurs.fond, borderColor: couleurs.fond },
});
