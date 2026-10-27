import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import BoutonChoix from '../components/BoutonChoix';
import { couleurs, polices, tailles } from '../theme';
import { Budget } from '../types/parcours';

const CHOIX: { valeur: Budget; libelle: string }[] = [
  { valeur: 'gratuit', libelle: 'Gratuit uniquement' },
  { valeur: '10', libelle: "Jusqu'à 10 €" },
  { valeur: '25', libelle: 'Entre 10 € et 25 €' },
  { valeur: 'illimite', libelle: 'Pas de limite' },
];

type Props = {
  valeur?: Budget;
  onChoisir: (b: Budget) => void;
  onSuivant: () => void;
  onRetour: () => void;
};

export default function EcranBudget({ valeur, onChoisir, onSuivant, onRetour }: Props) {
  const [aEssaye, setAEssaye] = useState(false);
  const afficherErreur = aEssaye && !valeur;

  const suivant = () => {
    if (!valeur) {
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

      <View style={styles.progression} accessible accessibilityLabel="Étape 3 sur 3">
        {[1, 2, 3].map((n) => (
          <View key={n} style={[styles.barre, styles.barreActive]} />
        ))}
        <Text style={styles.compteur}>3 / 3</Text>
      </View>

      <Text style={styles.etiquette}>QUESTION 3 SUR 3 — DERNIÈRE !</Text>
      <Text accessibilityRole="header" style={styles.titre}>
        Quel est ton budget pour cette sortie ?
      </Text>
      <Text style={styles.aide}>Une seule réponse.</Text>

      <View accessibilityRole="radiogroup" style={{ marginTop: 24 }}>
        {CHOIX.map((c) => (
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

      <Text style={styles.confidentialite}>Tes données ne sont pas enregistrées.</Text>

      <Pressable
        onPress={suivant}
        accessibilityRole="button"
        accessibilityLabel="Voir les résultats"
        style={styles.suivant}
      >
        <Text style={styles.suivantTexte}>Voir les résultats ›</Text>
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
  confidentialite: {
    fontFamily: polices.texte,
    color: couleurs.texteSecondaire,
    fontSize: tailles.texte,
    marginTop: 12,
  },
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