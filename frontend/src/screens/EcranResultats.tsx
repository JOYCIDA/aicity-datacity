import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import CarteActivite from '../components/CarteActivite';
import { activitesExemple } from '../data/activitesExemple';
import { Activite } from '../types/activite';
import { Reponses } from '../types/parcours';
import { couleurs, polices, tailles } from '../theme';

const LIBELLES_DUREE: Record<string, string> = {
  '30min': '30 minutes',
  '1h': '1 heure',
  '2h': '2 heures',
  soiree: 'Toute la soirée',
  inconnu: 'Durée libre',
};

const LIBELLES_BUDGET: Record<string, string> = {
  gratuit: 'Gratuit',
  '10': "Jusqu'à 10 €",
  '25': "Jusqu'à 25 €",
  illimite: 'Sans limite de budget',
};

function filtrer(activites: Activite[], reponses: Reponses): Activite[] {
  return activites.filter((a) => {
    const budgetMax =
      reponses.budget === 'gratuit' ? 0 :
      reponses.budget === '10' ? 10 :
      reponses.budget === '25' ? 25 :
      Infinity;
    const dansLeBudget = a.prix <= budgetMax;
    const dansLesInterets =
      reponses.interets.length === 0 || reponses.interets.includes(a.categorie);
    return dansLeBudget && dansLesInterets;
  });
}

type Props = {
  reponses: Reponses;
  onRetour: () => void;
  onOuvrir: (activite: Activite) => void;
};

export default function EcranResultats({ reponses, onRetour, onOuvrir }: Props) {
  const resultats = filtrer(activitesExemple, reponses);
  const n = resultats.length;
  const resume = [
    reponses.duree ? LIBELLES_DUREE[reponses.duree] : null,
    reponses.budget ? LIBELLES_BUDGET[reponses.budget] : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.page}>
      <Pressable
        onPress={onRetour}
        accessibilityRole="button"
        accessibilityLabel="Modifier mes choix"
        style={styles.retour}
      >
        <Text style={styles.retourTexte}>‹ Modifier mes choix</Text>
      </Pressable>

      <Text accessibilityRole="header" style={styles.titre}>
        {n === 0
          ? 'Aucune activité trouvée'
          : `${n} activité${n > 1 ? 's' : ''} trouvée${n > 1 ? 's' : ''} près de toi`}
      </Text>
      <Text style={styles.resume}>{resume}</Text>

      {n === 0 ? (
        <Text style={styles.vide}>
          Aucune activité ne correspond à tes choix. Modifie ton budget ou tes centres d'intérêt.
        </Text>
      ) : (
        <FlatList
          data={resultats}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => ( <CarteActivite activite={item} onPress={() => onOuvrir(item)} />)}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
        />
      )}
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
  titre: { fontFamily: polices.titre, color: couleurs.texte, fontSize: 28 },
  resume: {
    fontFamily: polices.texte,
    color: couleurs.texteSecondaire,
    fontSize: tailles.texte,
    marginTop: 6,
  },
  vide: {
    fontFamily: polices.texte,
    color: couleurs.texte,
    fontSize: tailles.texte,
    marginTop: 24,
  },
});