import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import BoutonChoix from '../components/BoutonChoix';
import { couleurs, polices, tailles } from '../theme';
import { Duree } from '../types/parcours';
import { Choix } from '../types/questions';

type Props = {
  choix: Choix<Duree>[];
  valeur?: Duree;
  onChoisir: (d: Duree) => void;
  onSuivant: () => void;
};

export default function EcranDuree({ choix, valeur, onChoisir, onSuivant }: Props) {
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
      <View style={styles.progression} accessible accessibilityLabel="Étape 1 sur 3">
        {[1, 2, 3].map((n) => (
          <View key={n} style={[styles.barre, n === 1 && styles.barreActive]} />
        ))}
        <Text style={styles.compteur}>1 / 3</Text>
      </View>

      <Text style={styles.etiquette}>QUESTION 1 SUR 3</Text>
      <Text accessibilityRole="header" style={styles.titre}>
        Combien de temps as-tu devant toi ?
      </Text>
      <Text style={styles.aide}>Une seule réponse.</Text>

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
          <Text style={styles.erreurTexte}>Choisis une réponse pour continuer.</Text>
        </View>
      )}

      <Pressable
        onPress={suivant}
        accessibilityRole="button"
        accessibilityLabel="Suivant"
        style={styles.suivant}
      >
        <Text style={styles.suivantTexte}>Suivant ›</Text>
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