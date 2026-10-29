import { View, Text, Pressable, ScrollView, Linking, StyleSheet } from 'react-native';
import { Activite } from '../types/activite';
import { couleurs, polices, tailles } from '../theme';
import { formaterPrix, formaterDistance } from '../utils/format';
import { useTextes } from '../i18n';
import { SIGNALEMENT_ACTIF } from '../config';

type Props = {
  activite: Activite;
  onRetour: () => void;
  onSignaler: () => void;
};

export default function EcranFiche({ activite, onRetour, onSignaler }: Props) {
  const t = useTextes();
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Pressable
        onPress={onRetour}
        accessibilityRole="button"
        accessibilityLabel={t.fiche.retourA11y}
        style={styles.retour}
      >
        <Text style={styles.retourTexte}>{t.fiche.retour}</Text>
      </Pressable>

      <Text style={styles.categorie}>{activite.categorieLibelle}</Text>
      <Text accessibilityRole="header" style={styles.titre}>
        {activite.titre}
      </Text>

      <View style={styles.pourquoi}>
        <Text accessibilityRole="header" style={styles.pourquoiTitre}>
          {t.fiche.pourquoi}
        </Text>
        <Text style={styles.raison}>{activite.explication}</Text>
      </View>

      <View style={styles.infos}>
        <Text style={styles.libelle}>{t.fiche.lieu}</Text>
        <Text style={styles.valeur}>{activite.lieu}</Text>
        {activite.adresse && <Text style={styles.raison}>{activite.adresse}</Text>}

        <Text style={styles.libelle}>{t.fiche.horaire}</Text>
        <Text style={styles.valeur}>{activite.horaires}</Text>

        <Text style={styles.libelle}>{t.fiche.prix}</Text>
        <Text style={styles.valeur}>{formaterPrix(activite.prix, t)}</Text>

        <Text style={styles.libelle}>{t.fiche.distance}</Text>
        <Text style={styles.valeur}>
          {formaterDistance(activite.distance_m)} · {t.aPied(activite.trajet_min)}
        </Text>
      </View>

      {activite.description && (
        <View style={styles.infos}>
          <Text accessibilityRole="header" style={styles.pourquoiTitre}>
            {t.fiche.description}
          </Text>
          <Text style={styles.raison}>{activite.description}</Text>
        </View>
      )}

      {activite.source_url && (
        <Pressable
          onPress={() => Linking.openURL(activite.source_url!)}
          accessibilityRole="link"
          accessibilityLabel={t.fiche.voirSur(activite.source)}
          style={styles.signaler}
        >
          <Text style={styles.signalerTexte}>{t.fiche.voirSur(activite.source)} ↗</Text>
        </Pressable>
      )}

      {SIGNALEMENT_ACTIF && (
        <Pressable
          onPress={onSignaler}
          accessibilityRole="button"
          accessibilityLabel={t.fiche.signaler}
          style={styles.signaler}
        >
          <Text style={styles.signalerTexte}>{t.fiche.signaler}</Text>
        </Pressable>
      )}

      <Text style={styles.source}>{t.sourceMaj(activite.source, activite.date_maj)}</Text>
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