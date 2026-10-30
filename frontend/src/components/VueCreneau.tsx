import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Activite } from '../types/activite';
import { couleurs, polices, tailles } from '../theme';
import { ICONES_CATEGORIE } from './Icones';
import { useTextes } from '../i18n';

type Props = {
  activites: Activite[];
  tempsLibreMinutes: number; // largeur de la frise : de maintenant à la fin du temps libre
  onOuvrir: (activite: Activite) => void;
};

const pourcent = (minutes: number, axe: number) => `${Math.min(100, Math.max(0, (minutes / axe) * 100))}%` as const;

// Frise du temps libre (maquette page 6). Même calcul que le filtre du backend : on arrive après
// le trajet à pied, l'activité commence à l'arrivée ou à l'ouverture, et dure dureeMinutes.
export default function VueCreneau({ activites, tempsLibreMinutes, onOuvrir }: Props) {
  const t = useTextes();
  const etroit = useWindowDimensions().width < 600;
  const [maintenant] = useState(() => Date.now());
  const axe = tempsLibreMinutes;
  const pas = axe <= 120 ? 30 : 60;
  const heure = (minutes: number) =>
    new Date(maintenant + minutes * 60_000).toLocaleTimeString(t.locale, { hour: '2-digit', minute: '2-digit' });
  const graduations = Array.from({ length: Math.floor(axe / pas) + 1 }, (_, i) => i * pas);

  return (
    <ScrollView style={styles.panneau} contentContainerStyle={styles.contenu}>
      <View style={styles.ligne}>
        {!etroit && <View style={styles.libelle} />}
        <View style={styles.axe}>
          {graduations.map((m, i) => (
            <Text
              key={m}
              style={[
                styles.graduation,
                { left: pourcent(m, axe) },
                // Première heure calée à gauche, dernière à droite : rien n'est coupé au bord.
                i === 0 && styles.graduationDebut,
                i === graduations.length - 1 && styles.graduationFin,
              ]}
            >
              {heure(m)}
            </Text>
          ))}
        </View>
      </View>

      {activites.map((a, i) => {
        const attente = (new Date(a.debut_iso).getTime() - maintenant) / 60_000;
        const arrivee = Math.max(a.trajet_min, attente);
        const finActivite = arrivee + a.duree_min;
        const ouverture = Math.max(0, attente);
        const fermeture = a.fin_iso ? (new Date(a.fin_iso).getTime() - maintenant) / 60_000 : axe;
        const Icone = ICONES_CATEGORIE[a.categorie];
        return (
          <Pressable
            key={a.id}
            onPress={() => onOuvrir(a)}
            accessibilityRole="button"
            accessibilityLabel={`${i + 1}. ${t.creneau.ligneA11y(a.titre, heure(arrivee), heure(finActivite))}`}
            // Sur téléphone, le titre passe au-dessus de la barre pour rester lisible.
            style={[styles.ligne, etroit && styles.ligneEtroite]}
          >
            <View style={[styles.libelle, etroit && styles.libelleEtroit]}>
              {Icone && <Icone size={18} color={couleurs.texte} />}
              <Text style={styles.libelleTexte} numberOfLines={2}>
                {i + 1}. {a.titre}
              </Text>
            </View>
            <View style={styles.piste}>
              <View
                style={[
                  styles.ouverture,
                  { left: pourcent(ouverture, axe), right: pourcent(axe - Math.min(fermeture, axe), axe) },
                ]}
              />
              <View
                style={[
                  styles.barre,
                  { left: pourcent(arrivee, axe), right: pourcent(axe - Math.min(finActivite, axe), axe) },
                ]}
              />
            </View>
          </Pressable>
        );
      })}

      <View style={styles.ligne}>
        {!etroit && <View style={styles.libelle} />}
        <Text style={styles.maintenant}>▲ {t.creneau.maintenant}</Text>
      </View>

      <View style={styles.legende}>
        <View style={styles.legendeElement}>
          <View style={[styles.pastille, { backgroundColor: couleurs.primaire }]} />
          <Text style={styles.legendeTexte}>{t.creneau.legendeActivite}</Text>
        </View>
        <View style={styles.legendeElement}>
          <View style={[styles.pastille, { backgroundColor: couleurs.carte }]} />
          <Text style={styles.legendeTexte}>{t.creneau.legendeOuverture}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  panneau: { flex: 1, marginTop: 16 },
  // Marge à droite : la dernière heure de la frise reste lisible.
  contenu: { gap: 14, paddingBottom: 24, paddingRight: 32 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  libelle: { width: 200, flexDirection: 'row', alignItems: 'center', gap: 8 },
  ligneEtroite: { flexDirection: 'column', alignItems: 'stretch', gap: 6 },
  libelleEtroit: { width: '100%' },
  libelleTexte: { flex: 1, fontFamily: polices.texteMoyen, color: couleurs.texte, fontSize: tailles.texte },
  axe: { flex: 1, height: 22 },
  graduation: {
    position: 'absolute',
    width: 60,
    marginLeft: -30,
    textAlign: 'center',
    fontFamily: polices.texte,
    color: couleurs.texteSecondaire,
    fontSize: tailles.petit,
  },
  graduationDebut: { marginLeft: 0, textAlign: 'left' },
  graduationFin: { marginLeft: -60, textAlign: 'right' },
  piste: { flexGrow: 1, height: 44, borderRadius: 22, backgroundColor: 'rgba(13, 60, 79, 0.45)' },
  ouverture: { position: 'absolute', top: 0, bottom: 0, borderRadius: 22, backgroundColor: couleurs.carte },
  barre: { position: 'absolute', top: 4, bottom: 4, borderRadius: 18, backgroundColor: couleurs.primaire },
  maintenant: { fontFamily: polices.texteMoyen, color: couleurs.primaire, fontSize: tailles.petit },
  legende: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginTop: 8 },
  legendeElement: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pastille: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: couleurs.primaire },
  legendeTexte: { fontFamily: polices.texte, color: couleurs.texteSecondaire, fontSize: tailles.texte },
});
