import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, useWindowDimensions } from 'react-native';
import CarteActivite from '../components/CarteActivite';
import CarteGeo from '../components/CarteGeo';
import VueCreneau from '../components/VueCreneau';
import VueCategories from '../components/VueCategories';
import EtatChargement from '../components/EtatChargement';
import BoutonTerminer from '../components/BoutonTerminer';
import { recommander, ErreurApi } from '../api/client';
import { versActivite } from '../api/adaptateur';
import { obtenirPosition, Position, RemarquePosition } from '../utils/position';
import { formaterPrix } from '../utils/format';
import { useLangue, useTextes } from '../i18n';
import { Activite } from '../types/activite';
import { Reponses } from '../types/parcours';
import { Questions } from '../types/questions';
import { couleurs, polices, tailles } from '../theme';
import { colors } from '../theme/tokens';

export type Recherche = {
  activites: Activite[];
  elargie: boolean;
  rayonM: number; // rayon finalement utilisé par le backend (doublé si élargi)
  position: Position; // utilisée seulement pour la carte, jamais enregistrée
  remarquePosition: RemarquePosition | null;
};

type Vue = 'liste' | 'carte' | 'creneau' | 'categories';

type Props = {
  questions: Questions;
  reponses: Reponses;
  recherche: Recherche | null; // null : pas encore chargée
  onRecherche: (r: Recherche) => void;
  onChangerDuree: (minutes: number) => void;
  onOuvrir: (activite: Activite) => void;
  onTerminer: () => void;
};

export default function EcranResultats({
  questions,
  reponses,
  recherche,
  onRecherche,
  onChangerDuree,
  onOuvrir,
  onTerminer,
}: Props) {
  const t = useTextes();
  const langue = useLangue();
  // Grand écran (ordinateur, borne) : carte et liste côte à côte, comme la maquette.
  const large = useWindowDimensions().width >= 900;
  const [vue, setVue] = useState<Vue>('liste');
  // Sur grand écran, la liste est toujours à côté de la carte : pas d'onglet Liste.
  const onglets: Vue[] = large ? ['carte', 'creneau', 'categories'] : ['liste', 'carte', 'creneau', 'categories'];
  const vueAffichee: Vue = large && vue === 'liste' ? 'carte' : vue;
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
        rayonM: r.rayonM,
        position,
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

  const liste = recherche && (
    <View style={[styles.panneau, large && styles.colonneListe]}>
      <FlatList
        data={recherche.activites}
        keyExtractor={(a) => a.id}
        renderItem={({ item, index }) => (
          <CarteActivite activite={item} numero={index + 1} onPress={() => onOuvrir(item)} />
        )}
        contentContainerStyle={styles.liste}
        ListFooterComponent={
          <Text style={styles.sources}>
            {t.resultats.sources([...new Set(recherche.activites.map((a) => a.source))].join(' / '))}
          </Text>
        }
      />
    </View>
  );

  const carte = recherche && (
    <View style={[styles.zoneCarte, large && styles.zoneCarteLarge]}>
      <CarteGeo position={recherche.position} activites={recherche.activites} onOuvrir={onOuvrir} />
    </View>
  );

  return (
    <View style={styles.page}>
      {erreur || !recherche ? (
        <EtatChargement message={t.resultats.chargement} erreur={erreur} onReessayer={charger} />
      ) : (
        <>
          <View style={styles.entete}>
            <Text accessibilityRole="header" style={styles.titre}>
              {n === 0 ? t.resultats.aucune : t.resultats.trouvees(n)}
            </Text>
            <BoutonTerminer onPress={onTerminer} />
          </View>
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
            <>
              <View style={styles.bascule} accessibilityRole="tablist" accessibilityLabel={t.carte.vue}>
                {onglets.map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => setVue(v)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: vueAffichee === v }}
                    style={[styles.basculeBouton, vueAffichee === v && styles.basculeActif]}
                  >
                    <Text style={[styles.basculeTexte, vueAffichee === v && styles.basculeTexteActif]}>
                      {t.carte[v]}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {vueAffichee === 'liste' && liste}
              {vueAffichee === 'carte' &&
                (large ? (
                  <View style={styles.deuxColonnes}>
                    {carte}
                    {liste}
                  </View>
                ) : (
                  carte
                ))}
              {vueAffichee === 'creneau' && (
                <VueCreneau
                  activites={recherche.activites}
                  tempsLibreMinutes={reponses.duree!}
                  onOuvrir={onOuvrir}
                />
              )}
              {vueAffichee === 'categories' && (
                <VueCategories position={recherche.position} rayonM={recherche.rayonM} />
              )}
            </>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 16 },
  entete: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  titre: { flexShrink: 1, fontFamily: polices.titre, color: couleurs.texte, fontSize: 28 },
  resume: {
    fontFamily: polices.texte,
    color: couleurs.texteSecondaire,
    fontSize: tailles.texte,
    marginTop: 6,
  },
  deuxColonnes: { flex: 1, flexDirection: 'row', gap: 16, marginTop: 16 },
  zoneCarte: { flex: 1, marginTop: 16 },
  zoneCarteLarge: { marginTop: 0 },
  // Zone claire de la liste, comme la colonne de droite de la maquette.
  panneau: { flex: 1, backgroundColor: colors.background, borderRadius: 24, marginTop: 16, overflow: 'hidden' },
  // flexBasis plutôt que flex: 0 (qui donne une largeur nulle sur le web).
  colonneListe: { flexGrow: 0, flexShrink: 0, flexBasis: 460, marginTop: 0 },
  liste: { padding: 12, width: '100%', maxWidth: 760, alignSelf: 'center' },
  sources: { fontFamily: polices.texte, color: colors.mutedForeground, fontSize: tailles.petit, marginTop: 4 },
  bascule: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'flex-start',
    gap: 4,
    padding: 4,
    marginTop: 16,
    borderRadius: 28,
    backgroundColor: couleurs.carte,
  },
  basculeBouton: {
    minHeight: tailles.zoneMin,
    minWidth: 88,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basculeActif: { backgroundColor: couleurs.primaire },
  basculeTexte: { fontFamily: polices.texteMoyen, color: couleurs.texte, fontSize: tailles.texte },
  basculeTexteActif: { color: couleurs.fond },
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
