import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import BoutonChoix from '../components/BoutonChoix';
import { interpreter, ErreurApi } from '../api/client';
import { couleurs, polices, tailles } from '../theme';
import { Choix } from '../types/questions';

type Props = {
  choix: Choix<string>[];
  valeurs: string[];
  onBasculer: (valeur: string) => void;
  onAjouter: (valeurs: string[]) => void;
  onSuivant: () => void;
  onRetour: () => void;
};

// Retour affiché sous le champ « Autre… » : ✓ si compris, ⚠ sinon.
type Retour = { ok: boolean; message: string };

export default function EcranInterets({ choix, valeurs, onBasculer, onAjouter, onSuivant, onRetour }: Props) {
  const [aEssaye, setAEssaye] = useState(false);
  const [texte, setTexte] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [retour, setRetour] = useState<Retour | null>(null);
  const afficherErreur = aEssaye && valeurs.length === 0;

  const comprendre = async () => {
    if (texte.trim() === '' || enCours) return;
    setEnCours(true);
    setRetour(null);
    try {
      const { categories } = await interpreter(texte.trim());
      if (categories.length === 0) {
        setRetour({
          ok: false,
          message: "Je n'ai pas reconnu d'activité dans ta phrase. Essaie d'autres mots ou choisis ci-dessus.",
        });
      } else {
        onAjouter(categories);
        const libelles = categories.map((c) => choix.find((x) => x.valeur === c)?.libelle ?? c);
        setRetour({ ok: true, message: `J'ai compris : ${libelles.join(', ')}. C'est coché ci-dessus.` });
        setTexte('');
      }
    } catch (e) {
      setRetour({
        ok: false,
        message: e instanceof ErreurApi ? e.message : 'Une erreur est survenue. Réessaie dans un instant.',
      });
    } finally {
      setEnCours(false);
    }
  };

  const suivant = () => {
    if (valeurs.length === 0) {
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

      <View style={styles.champ}>
        <Text nativeID="libelle-autre" style={styles.champLibelle}>
          Autre… dis-moi avec tes mots
        </Text>
        <View style={styles.ligne}>
          <TextInput
            value={texte}
            onChangeText={setTexte}
            onSubmitEditing={comprendre}
            maxLength={500}
            returnKeyType="done"
            placeholder="Ex. : voir une expo, courir au parc"
            placeholderTextColor={couleurs.texteSecondaire}
            accessibilityLabel="Autre : décris ce que tu as envie de faire"
            accessibilityLabelledBy="libelle-autre"
            style={styles.champSaisie}
          />
          <Pressable
            onPress={comprendre}
            disabled={enCours}
            accessibilityRole="button"
            accessibilityLabel="Valider ma phrase"
            accessibilityState={{ disabled: enCours, busy: enCours }}
            style={styles.valider}
          >
            {enCours ? (
              <ActivityIndicator color={couleurs.fond} />
            ) : (
              <Text style={styles.validerTexte}>OK</Text>
            )}
          </Pressable>
        </View>
        <Text style={styles.confidentialite}>Ta phrase n'est jamais enregistrée.</Text>
        {retour && (
          <View style={styles.erreur} accessibilityRole="alert">
            <Text style={retour.ok ? styles.succesIcone : styles.erreurIcone}>{retour.ok ? '✓' : '⚠'}</Text>
            <Text style={retour.ok ? styles.succesTexte : styles.erreurTexte}>{retour.message}</Text>
          </View>
        )}
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
  ligne: { flexDirection: 'row', gap: 8 },
  champSaisie: {
    flex: 1,
    minHeight: 56,
    borderWidth: 2,
    borderColor: couleurs.primaire,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontFamily: polices.texteMoyen,
    fontSize: 18,
    color: couleurs.texte,
  },
  valider: {
    minWidth: 64,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: couleurs.primaire,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validerTexte: { fontFamily: polices.titre, color: couleurs.fond, fontSize: 18 },
  confidentialite: {
    fontFamily: polices.texte,
    color: couleurs.texteSecondaire,
    fontSize: tailles.texte,
    marginTop: 6,
  },
  erreur: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  erreurIcone: { color: couleurs.erreur, fontSize: 20 },
  erreurTexte: { flex: 1, fontFamily: polices.texteMoyen, color: couleurs.erreur, fontSize: tailles.texte },
  succesIcone: { color: couleurs.primaire, fontSize: 20 },
  succesTexte: { flex: 1, fontFamily: polices.texteMoyen, color: couleurs.texte, fontSize: tailles.texte },
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
