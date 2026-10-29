import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import CarteActivite from '../components/CarteActivite';
import { recommander, ErreurApi } from '../api/client';
import { versActivite } from '../api/adaptateur';
import { DUREES, BUDGETS } from '../data/questions';
import { POSITION_PAR_DEFAUT } from '../config';
import { Activite } from '../types/activite';
import { Reponses } from '../types/parcours';
import { couleurs, polices, tailles } from '../theme';

export type Recherche = { activites: Activite[]; elargie: boolean };

type Props = {
  reponses: Reponses;
  recherche: Recherche | null; // null : pas encore chargée
  onRecherche: (r: Recherche) => void;
  onRetour: () => void;
  onOuvrir: (activite: Activite) => void;
};

export default function EcranResultats({ reponses, recherche, onRecherche, onRetour, onOuvrir }: Props) {
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setErreur(null);
    try {
      const r = await recommander({
        ...POSITION_PAR_DEFAUT,
        tempsLibreMinutes: reponses.duree ?? DUREES[0].valeur,
        budgetMax: reponses.budget === undefined ? null : reponses.budget,
        categories: reponses.interets,
      });
      onRecherche({ activites: r.resultats.map(versActivite), elargie: r.elargie });
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : 'Une erreur est survenue. Réessaie dans un instant.');
    }
  }, [reponses, onRecherche]);

  useEffect(() => {
    if (!recherche) charger();
  }, [recherche, charger]);

  const resume = [
    DUREES.find((d) => d.valeur === reponses.duree)?.libelle,
    BUDGETS.find((b) => b.valeur === reponses.budget)?.libelle,
  ]
    .filter(Boolean)
    .join(' · ');

  const n = recherche?.activites.length ?? 0;

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

      {erreur ? (
        <View>
          <View style={styles.erreur} accessibilityRole="alert">
            <Text style={styles.erreurIcone}>⚠</Text>
            <Text style={styles.erreurTexte}>{erreur}</Text>
          </View>
          <Pressable
            onPress={charger}
            accessibilityRole="button"
            accessibilityLabel="Réessayer"
            style={styles.bouton}
          >
            <Text style={styles.boutonTexte}>Réessayer</Text>
          </Pressable>
        </View>
      ) : !recherche ? (
        <View style={styles.chargement} accessible accessibilityLabel="Recherche des activités en cours">
          <ActivityIndicator size="large" color={couleurs.primaire} />
          <Text style={styles.resume}>Je cherche des activités près de toi…</Text>
        </View>
      ) : (
        <>
          <Text accessibilityRole="header" style={styles.titre}>
            {n === 0
              ? 'Aucune activité trouvée'
              : `${n} activité${n > 1 ? 's' : ''} trouvée${n > 1 ? 's' : ''} près de toi`}
          </Text>
          <Text style={styles.resume}>{resume}</Text>
          {recherche.elargie && n > 0 && (
            <Text style={styles.resume}>Peu d'activités tout près : nous avons élargi la zone de recherche.</Text>
          )}

          {n === 0 ? (
            <Text style={styles.vide}>
              Aucune activité ne correspond à tes choix. Modifie ton budget ou tes centres d'intérêt.
            </Text>
          ) : (
            <FlatList
              data={recherche.activites}
              keyExtractor={(a) => a.id}
              renderItem={({ item }) => <CarteActivite activite={item} onPress={() => onOuvrir(item)} />}
              contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
            />
          )}
        </>
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
  chargement: { alignItems: 'center', gap: 12, marginTop: 48 },
  erreur: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24 },
  erreurIcone: { color: couleurs.erreur, fontSize: 20 },
  erreurTexte: { flex: 1, fontFamily: polices.texteMoyen, color: couleurs.erreur, fontSize: tailles.texte },
  bouton: {
    alignSelf: 'flex-start',
    minHeight: tailles.zoneMin + 12,
    justifyContent: 'center',
    backgroundColor: couleurs.primaire,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginTop: 16,
  },
  boutonTexte: { fontFamily: polices.titre, color: couleurs.fond, fontSize: 20 },
});
