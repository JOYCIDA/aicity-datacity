import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Activite } from '../types/activite';
import { couleurs, polices, tailles } from '../theme';
import { formaterPrix, formaterDistance, LIBELLES_CATEGORIE } from '../utils/format';

type Props = {
  activite: Activite;
  onRetour: () => void;
  onSignaler: () => void;
};

export default function EcranFiche({ activite, onRetour, onSignaler }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Pressable
        onPress={onRetour}
        accessibilityRole="button"
        accessibilityLabel="Retour aux résultats"
        style={styles.retour}
      >
        <Text style={styles.retourTexte}>‹ Retour aux résultats</Text>
      </Pressable>

      <Text style={styles.categorie}>{LIBELLES_CATEGORIE[activite.categorie]}</Text>
      <Text accessibilityRole="header" style={styles.titre}>
        {activite.titre}
      </Text>

      <View style={styles.infos}>
        <Text style={styles.libelle}>Lieu</Text>
        <Text style={styles.valeur}>{activite.lieu}</Text>

        <Text style={styles.libelle}>Horaire</Text>
        <Text style={styles.valeur}>{activite.horaires}</Text>

        <Text style={styles.libelle}>Prix</Text>
        <Text style={styles.valeur}>{formaterPrix(activite.prix)}</Text>

        <Text style={styles.libelle}>Distance</Text>
        <Text style={styles.valeur}>{formaterDistance(activite.distance_m)}</Text>
      </View>

      <View style={styles.pourquoi}>
        <Text accessibilityRole="header" style={styles.pourquoiTitre}>
          Pourquoi cette proposition ?
        </Text>
        {activite.raisons.map((r) => (
          <Text key={r} style={styles.raison}>
            • {r}
          </Text>
        ))}
      </View>

      <Pressable
        onPress={onSignaler}
        accessibilityRole="button"
        accessibilityLabel="Signaler une information erronée"
        style={styles.signaler}
      >
        <Text style={styles.signalerTexte}>Signaler une information erronée</Text>
      </Pressable>

      <Text style={styles.source}>
        Source : {activite.source} · Mis à jour le {activite.date_maj}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 32 },
  retour: {
    alignSelf: 'flex-start',
    minHeight: tailles.zoneMin,
    justifyContent: 'center',
    marginBottom: 8,
  },
  retourTexte: { fontFamily: polices.texteMoyen, color: couleurs.texte, fontSize: 18 },
  categorie: {
    fontFamily: polices.texteMoyen,
    color: couleurs.primaire,
    fontSize: tailles.petit,
    letterSpacing: 1,
  },
  titre: { fontFamily: polices.titre, color: couleurs.texte, fontSize: 30, marginTop: 4 },
  infos: {
    backgroundColor: couleurs.carte,
    borderRadius: 24,
    padding: 16,
    marginTop: 20,
  },
  libelle: {
    fontFamily: polices.texte,
    color: couleurs.texteSecondaire,
    fontSize: tailles.texte,
    marginTop: 8,
  },
  valeur: { fontFamily: polices.texteMoyen, color: couleurs.texte, fontSize: 18 },
  pourquoi: {
    borderWidth: 2,
    borderColor: couleurs.primaire,
    borderRadius: 24,
    padding: 16,
    marginTop: 20,
  },
  pourquoiTitre: { fontFamily: polices.titre, color: couleurs.texte, fontSize: 22, marginBottom: 8 },
  raison: { fontFamily: polices.texte, color: couleurs.texte, fontSize: tailles.texte, marginTop: 4 },
  signaler: {
    minHeight: tailles.zoneMin + 8,
    borderWidth: 2,
    borderColor: couleurs.primaire,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signalerTexte: { fontFamily: polices.texteMoyen, color: couleurs.texte, fontSize: 18 },
  source: {
    fontFamily: polices.texte,
    color: couleurs.texteSecondaire,
    fontSize: tailles.petit,
    marginTop: 20,
  },
});