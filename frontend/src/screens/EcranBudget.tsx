import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import BoutonChoix from '../components/BoutonChoix';
import { couleurs, polices, tailles } from '../theme';
import { Budget } from '../types/parcours';
import { Choix, SaisieLibre } from '../types/questions';

type Props = {
  choix: Choix<Budget>[];
  saisieLibre: SaisieLibre | null;
  valeur?: Budget;
  onChoisir: (b: Budget | undefined) => void;
  onSuivant: () => void;
  onRetour: () => void;
};

// Montant en euros avec au plus 2 décimales, virgule ou point.
const FORMAT_MONTANT = /^\d+([.,]\d{1,2})?$/;

export default function EcranBudget({ choix, saisieLibre, valeur, onChoisir, onSuivant, onRetour }: Props) {
  const [aEssaye, setAEssaye] = useState(false);
  const montantLibre = valeur !== undefined && !choix.some((c) => c.valeur === valeur);
  const [texte, setTexte] = useState(montantLibre ? String(valeur).replace('.', ',') : '');

  const montant = Number(texte.trim().replace(',', '.'));
  const texteInvalide =
    saisieLibre !== null &&
    texte.trim() !== '' &&
    (!FORMAT_MONTANT.test(texte.trim()) || montant < saisieLibre.min || montant > saisieLibre.max);
  const afficherErreur = aEssaye && valeur === undefined && !texteInvalide;

  const saisir = (t: string) => {
    setTexte(t);
    const m = Number(t.trim().replace(',', '.'));
    const valide =
      saisieLibre !== null && FORMAT_MONTANT.test(t.trim()) && m >= saisieLibre.min && m <= saisieLibre.max;
    onChoisir(valide ? m : undefined);
  };

  const choisir = (b: Budget) => {
    setTexte('');
    onChoisir(b);
  };

  const suivant = () => {
    if (valeur === undefined) {
      setAEssaye(true);
      return;
    }
    onSuivant();
  };

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
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
        {choix.map((c) => (
          <BoutonChoix
            key={String(c.valeur)}
            libelle={c.libelle}
            selectionne={texte === '' && valeur === c.valeur}
            onPress={() => choisir(c.valeur)}
          />
        ))}
      </View>

      {saisieLibre && (
        <View style={styles.champ}>
          <Text nativeID="libelle-montant" style={styles.champLibelle}>
            {saisieLibre.libelle} ({saisieLibre.unite})
          </Text>
          <TextInput
            value={texte}
            onChangeText={saisir}
            keyboardType="decimal-pad"
            placeholder="Ex. : 15"
            placeholderTextColor={couleurs.texteSecondaire}
            accessibilityLabel={`${saisieLibre.libelle} en ${saisieLibre.unite}`}
            accessibilityLabelledBy="libelle-montant"
            style={[styles.champSaisie, texte !== '' && !texteInvalide && styles.champActif]}
          />
          {texteInvalide && (
            <View style={styles.erreur} accessibilityRole="alert">
              <Text style={styles.erreurIcone}>⚠</Text>
              <Text style={styles.erreurTexte}>
                Entre un montant entre {saisieLibre.min} et {saisieLibre.max.toLocaleString('fr-FR')}{' '}
                {saisieLibre.unite}, avec au plus 2 chiffres après la virgule.
              </Text>
            </View>
          )}
        </View>
      )}

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: 16 },
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
  champ: { marginTop: 8 },
  champLibelle: { fontFamily: polices.texteMoyen, color: couleurs.texte, fontSize: tailles.texte, marginBottom: 6 },
  champSaisie: {
    minHeight: 56,
    borderWidth: 2,
    borderColor: couleurs.primaire,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontFamily: polices.texteMoyen,
    fontSize: 18,
    color: couleurs.texte,
  },
  champActif: { borderWidth: 3 },
  erreur: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  erreurIcone: { color: couleurs.erreur, fontSize: 20 },
  erreurTexte: { flex: 1, fontFamily: polices.texteMoyen, color: couleurs.erreur, fontSize: tailles.texte },
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
