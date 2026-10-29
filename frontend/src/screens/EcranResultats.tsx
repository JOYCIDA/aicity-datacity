import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import CarteActivite from '../components/CarteActivite';
import EtatChargement from '../components/EtatChargement';
import { recommander, ErreurApi } from '../api/client';
import { versActivite } from '../api/adaptateur';
import { obtenirPosition, RemarquePosition } from '../utils/position';
import { formaterPrix } from '../utils/format';
import { useLangue, useTextes } from '../i18n';
import { Activite } from '../types/activite';
import { Reponses } from '../types/parcours';
import { Questions } from '../types/questions';
import { couleurs, polices, tailles } from '../theme';

export type Recherche = { activites: Activite[]; elargie: boolean; remarquePosition: RemarquePosition | null };

type Props = {
  questions: Questions;
  reponses: Reponses;
  recherche: Recherche | null; // null : pas encore chargée
  onRecherche: (r: Recherche) => void;
  onChangerDuree: (minutes: number) => void;
  onOuvrir: (activite: Activite) => void;
};

export default function EcranResultats({
  questions,
  reponses,
  recherche,
  onRecherche,
  onChangerDuree,
  onOuvrir,
}: Props) {
  const t = useTextes();
  const langue = useLangue();
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setErreur(null);
    try {
      const { position, remarque } = await obtenirPosition();
      const r = await recommander({
        ...position,
        tempsLibreMinutes: reponses.duree!,
        budgetMax: reponses.budget === undefined ? null : reponses.budget,
        categories: reponses.interets,
      });
      onRecherche({
        activites: r.resultats.map((x) => versActivite(x, langue)),
        elargie: r.elargie,
        remarquePosition: remarque,
      });
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : t.erreurs.generique);
    }
  }, [reponses, onRecherche, langue, t]);

  useEffect(() => {
    if (!recherche) charger();
  }, [recherche, charger]);

  const libelleBudget =
    reponses.budget === undefined
      ? undefined
      : questions.budgets.find((b) => b.valeur === reponses.budget)?.libelle ??
        t.resultats.jusqua(formaterPrix(reponses.budget, t));
  const resume = [questions.durees.find((d) => d.valeur === reponses.duree)?.libelle, libelleBudget]
    .filter(Boolean)
    .join(' · ');

  const n = recherche?.activites.length ?? 0;
  // Aucun résultat : on propose la durée suivante parmi celles du backend.
  const dureeSuivante = questions.durees.find((d) => reponses.duree !== undefined && d.valeur > reponses.duree);

  return (
    <View style={styles.page}>
      {erreur || !recherche ? (
        <EtatChargement message={t.resultats.chargement} erreur={erreur} onReessayer={charger} />
      ) : (
        <>
          <Text accessibilityRole="header" style={styles.titre}>
            {n === 0 ? t.resultats.aucune : t.resultats.trouvees(n)}
          </Text>
          <Text style={styles.resume}>{resume}</Text>
          {recherche.remarquePosition && (
            <Text style={styles.resume} accessibilityRole="text">
              ℹ {t.position[recherche.remarquePosition]}
            </Text>
          )}
          {recherche.elargie && n > 0 && <Text style={styles.resume}>{t.resultats.elargie}</Text>}

          {n === 0 ? (
            <View>
              <Text style={styles.vide}>{dureeSuivante ? t.resultats.aucunTemps : t.resultats.aucunChoix}</Text>
              {dureeSuivante && (
                <Pressable
                  onPress={() => onChangerDuree(dureeSuivante.valeur)}
                  accessibilityRole="button"
                  accessibilityLabel={t.resultats.plusDeTemps(dureeSuivante.libelle)}
                  style={styles.bouton}
                >
                  <Text style={styles.boutonTexte}>{t.resultats.plusDeTemps(dureeSuivante.libelle)}</Text>
                </Pressable>
              )}
            </View>
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
  bouton: {
    alignSelf: 'flex-start',
    minHeight: tailles.zoneMin + 12,
    justifyContent: 'center',
    backgroundColor: couleurs.primaire,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginTop: 16,
  },
  boutonTexte: { fontFamily: polices.titre, color: couleurs.fond, fontSize: 18 },
});
