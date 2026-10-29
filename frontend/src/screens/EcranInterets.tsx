import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import BoutonChoix from '../components/BoutonChoix';
import { couleurs, polices, tailles } from '../theme';
import { Choix } from '../types/questions';

type Props = {
  choix: Choix<string>[];
  valeurs: string[];
  onBasculer: (valeur: string) => void;
  onSuivant: () => void;
  onRetour: () => void;
};

export default function EcranInterets({ choix, valeurs, onBasculer, onSuivant, onRetour }: Props) {
  const [aEssaye, setAEssaye] = useState(false);
  const afficherErreur = aEssaye && valeurs.length === 0;

  const suivant = () => {
    if (valeurs.length === 0) {
      setAEssaye(true);
      return;
    }
    onSuivant();
  };

  return (
    <View style={styles.page}>
      <Pressable
        onPress={onRetour}
        accessibilityRole="button"
        accessibilityLabel="Retour"
        style={styles.retour}
      >
        <Text style={styles.retourTexte}>‹ Retour</Text>
      </Pressable>

      <View style={styles.progression} accessible accessibilityLabel="Étape 2 sur 3">
        {[1, 2, 3].map((n) => (
          <View key={n} style={[styles.barre, n <= 2 && styles.barreActive]} />
        ))}
        <Text style={styles.compteur}>2 / 3</Text>
      </View>

      <Text style={styles.etiquette}>QUESTION 2 SUR 3</Text>
      <Text accessibilityRole="header" style={styles.titre}>
        Qu'est-ce qui t'attire le plus en ce moment ?
      </Text>
      <Text style={styles.aide}>Choisis une ou plusieurs réponses.</Text>

      <View style={{ marginTop: 24 }}>
        {choix.map((c) => (
          <BoutonChoix
            key={c.valeur}
            multiple
            libelle={c.libelle}
            selectionne={valeurs.includes(c.valeur)}
            onPress={() => onBasculer(c.valeur)}
          />
        ))}
      </View>

      {afficherErreur && (
        <View style={styles.erreur} accessibilityRole="alert">
          <Text style={styles.erreurIcone}>⚠</Text>
          <Text style={styles.erreurTexte}>Choisis au moins une réponse pour continuer.</Text>
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
  retour: {
    alignSelf: 'flex-start',
    minHeight: tailles.zoneMin,
    justifyContent: 'center',
    marginBottom: 8,
  },
  retourTexte: { fontFamily: polices.texteMoyen, color: couleurs.texte, fontSize: 18 },
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