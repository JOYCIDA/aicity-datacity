import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import BoutonChoix from '../components/BoutonChoix';
import { couleurs, polices, tailles } from '../theme';
import { Duree } from '../types/parcours';
import { Choix } from '../types/questions';
import { useTextes } from '../i18n';

type Props = {
  choix: Choix<Duree>[];
  valeur?: Duree;
  onChoisir: (d: Duree) => void;
  onSuivant: () => void;
};

export default function EcranDuree({ choix, valeur, onChoisir, onSuivant }: Props) {
  const t = useTextes();
  const [aEssaye, setAEssaye] = useState(false);
  const afficherErreur = aEssaye && valeur === undefined;

  const suivant = () => {
    if (valeur === undefined) {
      setAEssaye(true);
      return;
    }
    onSuivant();
  };

  return (
    <View style={styles.page}>
      <View style={styles.progression} accessible accessibilityLabel={t.etape(1)}>
        {[1, 2, 3].map((n) => (
          <View key={n} style={[styles.barre, n === 1 && styles.barreActive]} />
        ))}
        <Text style={styles.compteur}>1 / 3</Text>
      </View>

      <Text style={styles.etiquette}>{t.question(1)}</Text>
      <Text accessibilityRole="header" style={styles.titre}>
        {t.duree.titre}
      </Text>
      <Text style={styles.aide}>{t.uneReponse}</Text>

      <View accessibilityRole="radiogroup" style={{ marginTop: 24 }}>
        {choix.map((c) => (
          <BoutonChoix
            key={c.valeur}
            libelle={c.libelle}
            selectionne={valeur === c.valeur}
            onPress={() => onChoisir(c.valeur)}
          />
        ))}
      </View>

      {afficherErreur && (
        <View style={styles.erreur} accessibilityRole="alert">
          <Text style={styles.erreurIcone}>⚠</Text>
          <Text style={styles.erreurTexte}>{t.erreurChoix}</Text>
        </View>
      )}

      <Pressable
        onPress={suivant}
        accessibilityRole="button"
        accessibilityLabel={t.suivantA11y}
        style={styles.suivant}
      >
        <Text style={styles.suivantTexte}>{t.suivant}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 16 },
  progression: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  barre: { flex: 1, height: 10, borderRadius: 5, backgroundColor: couleurs.barreInactive },
  barreActive: { backgroundColor: couleurs.primaire },
  compteur: { fontFamily: polices.texte, color: couleurs.texteSecondaire, fontSize: tailles.texte, marginLeft: 8 },
  etiquette: { fontFamily: polices.texte, color: couleurs.primaire, letterSpacing: 1.5, fontSize: tailles.petit },
  titre: { fontFamily: polices.titre, color: couleurs.texte, fontSize: 30, marginTop: 8 },
  aide: { fontFamily: polices.texte, color: couleurs.texteSecondaire, fontSize: tailles.texte, marginTop: 8 },
  erreur: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  erreurIcone: { color: couleurs.erreur, fontSize: 20 },
  erreurTexte: { fontFamily: polices.texteMoyen, color: couleurs.erreur, fontSize: tailles.texte },
  suivant: {
    alignSelf: 'flex-end',
    marginTop: 'auto',
    minHeight: tailles.zoneMin + 12,
    justifyContent: 'center',
    backgroundColor: couleurs.primaire,
    paddingHorizontal: 32,
    borderRadius: 30,
  },
  suivantTexte: { fontFamily: polices.titre, color: couleurs.fond, fontSize: 20 },
});