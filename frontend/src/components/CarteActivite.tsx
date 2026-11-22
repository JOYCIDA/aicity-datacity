import { Pressable, View, Text, Image, StyleSheet } from 'react-native';
import { Activite } from '../types/activite';
import { couleurs, polices } from '../theme';
import { formaterPrix, formaterDistance, SEP } from '../utils/format';
import { ICONES_CATEGORIE } from './Icones';
import MentionFrancais from './MentionFrancais';
import { useTextes } from '../i18n';
import { useDesign } from '../design';

type Props = {
  activite: Activite;
  numero?: number; // même numéro que la pastille sur la carte
  onPress?: () => void;
  vedette?: boolean; // 1re proposition : grande photo au-dessus du texte
};

// Une ligne de liste : vignette à gauche, texte à droite, trait fin entre deux activités.
export default function CarteActivite({ activite, numero, onPress, vedette = false }: Props) {
  const t = useTextes();
  const d = useDesign();
  const prix = formaterPrix(activite.prix, t);
  const distance = `${t.aPied(activite.trajet_min)}${SEP}${formaterDistance(activite.distance_m, t)}`;
  const IconeCategorie = ICONES_CATEGORIE[activite.categorie];
  const vignette = d.px(104);
  // Vedette : photo sur toute la largeur de la carte, hauteur fixe pour garder la liste visible.
  const taillePhoto = vedette ? { width: '100%' as const, height: d.px(200) } : { width: vignette, height: vignette };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${numero ? `${numero}. ` : ''}${activite.titre}, ${activite.categorieLibelle}, ${activite.lieu}, ${activite.horaires}, ${prix}, ${distance}`}
      style={({ pressed }) => [
        styles.carte,
        vedette && styles.carteVedette,
        { paddingVertical: d.px(16), gap: vedette ? d.px(12) : d.px(16) },
        pressed && styles.appuyee,
      ]}
    >
      <View style={vedette && styles.photoVedette}>
        {activite.photo_url ? (
          <Image
            source={{ uri: activite.photo_url }}
            resizeMode="cover"
            style={[styles.photo, taillePhoto]}
            accessible={false}
          />
        ) : (
          <View style={[styles.photo, styles.sansPhoto, taillePhoto]}>
            {IconeCategorie && <IconeCategorie size={d.px(32)} color={couleurs.texteSecondaire} />}
          </View>
        )}
        {numero !== undefined && (
          <View
            style={[
              styles.numero,
              vedette && styles.numeroVedette,
              { minWidth: d.px(24), minHeight: d.px(24), borderRadius: d.px(12) },
            ]}
          >
            <Text style={[d.typo('legende'), styles.numeroTexte]}>{numero}</Text>
          </View>
        )}
      </View>

      <View style={styles.contenu}>
        <View style={styles.entete}>
          <Text style={[d.typo('legende'), styles.secondaire]}>{activite.categorieLibelle}</Text>
          {activite.non_traduit && <MentionFrancais />}
        </View>
        <Text style={[d.typo(vedette ? 'sousTitre' : 'corpsFort'), styles.titre]} numberOfLines={2}>
          {activite.titre}
        </Text>
        <Text style={[d.typo('corps'), styles.secondaire]} numberOfLines={1}>
          {activite.lieu}
        </Text>
        <Text style={[d.typo('corps'), styles.secondaire, styles.chiffres]} numberOfLines={2}>
          {activite.horaires}
        </Text>
        <Text style={[d.typo('corpsFort'), styles.cle, { marginTop: d.px(4) }]}>
          {prix}
          {SEP}
          {distance}
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
  carteVedette: { flexDirection: 'column', alignItems: 'stretch' },
  appuyee: { backgroundColor: couleurs.carte },
  photoVedette: { alignSelf: 'stretch' },
  photo: { borderRadius: 10, backgroundColor: couleurs.carte },
  sansPhoto: { alignItems: 'center', justifyContent: 'center' },
  numero: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 7,
    backgroundColor: couleurs.texte,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroVedette: { top: 10, left: 10 },
  numeroTexte: { fontFamily: polices.titre, color: couleurs.fond, fontVariant: ['tabular-nums'] },
  contenu: { flex: 1 },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titre: { fontFamily: polices.titre, color: couleurs.texte },
  secondaire: { color: couleurs.texteSecondaire },
  // Chiffres de même largeur : les heures restent alignées d'une ligne à l'autre.
  chiffres: { fontVariant: ['tabular-nums'] },
  cle: { color: couleurs.texte },
});
