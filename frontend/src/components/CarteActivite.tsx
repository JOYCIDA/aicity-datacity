import { Pressable, View, Text, Image, StyleSheet } from 'react-native';
import { Activite } from '../types/activite';
import { couleurs, polices } from '../theme';
import { formaterPrix, formaterDistance } from '../utils/format';
import { ICONES_CATEGORIE } from './Icones';
import MentionFrancais from './MentionFrancais';
import { useTextes } from '../i18n';
import { useDesign } from '../design';

type Props = {
  activite: Activite;
  numero?: number; // même numéro que la pastille sur la carte
  onPress?: () => void;
};

// Une ligne de liste : vignette à gauche, texte à droite, trait fin entre deux activités.
export default function CarteActivite({ activite, numero, onPress }: Props) {
  const t = useTextes();
  const d = useDesign();
  const prix = formaterPrix(activite.prix, t);
  const distance = `${t.aPied(activite.trajet_min)} · ${formaterDistance(activite.distance_m)}`;
  const IconeCategorie = ICONES_CATEGORIE[activite.categorie];
  const vignette = d.px(104);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${numero ? `${numero}. ` : ''}${activite.titre}, ${activite.categorieLibelle}, ${activite.lieu}, ${activite.horaires}, ${prix}, ${distance}`}
      style={({ pressed }) => [styles.carte, { paddingVertical: d.px(16), gap: d.px(16) }, pressed && styles.appuyee]}
    >
      <View>
        {activite.photo_url ? (
          <Image
            source={{ uri: activite.photo_url }}
            resizeMode="cover"
            style={[styles.photo, { width: vignette, height: vignette }]}
            accessible={false}
          />
        ) : (
          <View style={[styles.photo, styles.sansPhoto, { width: vignette, height: vignette }]}>
            {IconeCategorie && <IconeCategorie size={d.px(32)} color={couleurs.texteSecondaire} />}
          </View>
        )}
        {numero !== undefined && (
          <View style={[styles.numero, { minWidth: d.px(26), height: d.px(26), borderRadius: d.px(13) }]}>
            <Text style={[styles.numeroTexte, { fontSize: d.px(14) }]}>{numero}</Text>
          </View>
        )}
      </View>

      <View style={styles.contenu}>
        <View style={styles.entete}>
          <Text style={[styles.secondaire, { fontSize: d.px(14) }]}>{activite.categorieLibelle}</Text>
          {activite.non_traduit && <MentionFrancais />}
        </View>
        <Text style={[styles.titre, { fontSize: d.px(17), lineHeight: d.px(22) }]} numberOfLines={2}>
          {activite.titre}
        </Text>
        <Text style={[styles.secondaire, { fontSize: d.px(15), lineHeight: d.px(20) }]} numberOfLines={1}>
          {activite.lieu}
        </Text>
        <Text style={[styles.secondaire, { fontSize: d.px(15), lineHeight: d.px(20) }]} numberOfLines={2}>
          {activite.horaires}
        </Text>
        <Text style={[styles.cle, { fontSize: d.px(15), marginTop: d.px(4) }]}>
          {prix} · {distance}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: couleurs.trait,
  },
  appuyee: { backgroundColor: couleurs.carte },
  photo: { borderRadius: 10, backgroundColor: couleurs.carte },
  sansPhoto: { alignItems: 'center', justifyContent: 'center' },
  numero: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    backgroundColor: couleurs.texte,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroTexte: { fontFamily: polices.titre, color: couleurs.fond },
  contenu: { flex: 1, gap: 2 },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titre: { fontFamily: polices.titre, color: couleurs.texte, letterSpacing: -0.2 },
  secondaire: { fontFamily: polices.texte, color: couleurs.texteSecondaire },
  cle: { fontFamily: polices.texteMoyen, color: couleurs.texte },
});
