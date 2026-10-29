import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import BoutonChoix from '../components/BoutonChoix';
import { interpreter, ErreurApi } from '../api/client';
import { couleurs, polices, tailles } from '../theme';
import { Choix } from '../types/questions';
import { useTextes } from '../i18n';

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
  const t = useTextes();
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
        setRetour({ ok: false, message: t.interets.nonCompris });
      } else {
        onAjouter(categories);
        const libelles = categories.map((c) => choix.find((x) => x.valeur === c)?.libelle ?? c);
        setRetour({ ok: true, message: t.interets.compris(libelles.join(', ')) });
        setTexte('');
      }
    } catch (e) {
      setRetour({ ok: false, message: e instanceof ErreurApi ? e.message : t.erreurs.generique });
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
        accessibilityLabel={t.retourA11y}
        style={styles.retour}
      >
        <Text style={styles.retourTexte}>{t.retour}</Text>
      </Pressable>

      <View style={styles.progression} accessible accessibilityLabel={t.etape(2)}>
        {[1, 2, 3].map((n) => (
          <View key={n} style={[styles.barre, n <= 2 && styles.barreActive]} />
        ))}
        <Text style={styles.compteur}>2 / 3</Text>
      </View>

      <Text style={styles.etiquette}>{t.question(2)}</Text>
      <Text accessibilityRole="header" style={styles.titre}>
        {t.interets.titre}
      </Text>
      <Text style={styles.aide}>{t.interets.aide}</Text>

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
          {t.interets.autreLibelle}
        </Text>
        <View style={styles.ligne}>
          <TextInput
            value={texte}
            onChangeText={setTexte}
            onSubmitEditing={comprendre}
            maxLength={500}
            returnKeyType="done"
            placeholder={t.interets.autrePlaceholder}
            placeholderTextColor={couleurs.texteSecondaire}
            accessibilityLabel={t.interets.autreA11y}
            accessibilityLabelledBy="libelle-autre"
            style={styles.champSaisie}
          />
          <Pressable
            onPress={comprendre}
            disabled={enCours}
            accessibilityRole="button"
            accessibilityLabel={t.interets.validerA11y}
            accessibilityState={{ disabled: enCours, busy: enCours }}
            style={styles.valider}
          >
            {enCours ? (
              <ActivityIndicator color={couleurs.fond} />
            ) : (
              <Text style={styles.validerTexte}>{t.interets.valider}</Text>
            )}
          </Pressable>
        </View>
        <Text style={styles.confidentialite}>{t.interets.phraseNonEnregistree}</Text>
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
          <Text style={styles.erreurTexte}>{t.interets.erreur}</Text>
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
