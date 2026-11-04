import { ArrowUpRight, Navigation, Share2 } from 'lucide-react-native';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  Linking,
  Platform,
  Share,
  StyleSheet,
} from 'react-native';
import { Activite } from '../types/activite';
import { couleurs, espace, LARGEUR_LECTURE, polices, rayons } from '../theme';
import { formaterPrix, formaterDistance, SEP } from '../utils/format';
import { ICONES_CATEGORIE } from '../components/Icones';
import MentionFrancais from '../components/MentionFrancais';
import { useTextes } from '../i18n';
import { SIGNALEMENT_ACTIF } from '../config';
import { useDesign } from '../design';
import BoutonTerminer from '../components/BoutonTerminer';

type Props = {
  activite: Activite;
  onSignaler: () => void;
  onTerminer: () => void;
};

// Sur le web, le partage n'existe que si le navigateur le propose.
const PARTAGE_DISPONIBLE =
  Platform.OS !== 'web' || (typeof navigator !== 'undefined' && typeof navigator.share === 'function');

// Une ligne d'information : libellé à gauche, valeur à droite, séparées par un trait fin.
function Ligne({ libelle, valeur }: { libelle: string; valeur: string }) {
  const d = useDesign();
  return (
    <View
      style={[styles.ligne, { paddingVertical: d.px(espace.m), gap: d.px(espace.l) }]}
      accessible
      accessibilityLabel={`${libelle} : ${valeur}`}
    >
      <Text style={[d.typo('corps'), styles.secondaire, { width: d.px(112) }]}>{libelle}</Text>
      <Text style={[d.typo('corpsFort'), styles.ligneValeur]}>{valeur}</Text>
    </View>
  );
}

export default function EcranFiche({ activite, onSignaler, onTerminer }: Props) {
  const t = useTextes();
  const d = useDesign();
  const large = d.mode === 'bureau';
  const IconeCategorie = ICONES_CATEGORIE[activite.categorie];
  const itineraire = `https://www.google.com/maps/dir/?api=1&destination=${activite.lat},${activite.lng}&travelmode=walking`;
  const hauteurPhoto = large ? 420 : d.mode === 'borne' ? 640 : 280;
  // Sur téléphone et borne, la photo va d'un bord à l'autre ; le texte garde une marge.
  const marge = large ? 0 : d.px(espace.xl);
  // Paragraphes limités à une largeur de lecture confortable (~70 caractères).
  const lecture = { maxWidth: d.px(LARGEUR_LECTURE) };

  const partager = async () => {
    try {
      await Share.share({
        title: activite.titre,
        message: `${t.fiche.partageMessage(activite.titre, activite.lieu, activite.horaires)} ${itineraire}`,
        url: activite.source_url ?? itineraire,
      });
    } catch {
      // Partage annulé ou indisponible : rien à faire.
    }
  };

  const action = (
    <View style={[large && styles.actionLarge, { padding: large ? d.px(espace.xl) : 0, gap: d.px(espace.l) }]}>
      <View style={{ gap: d.px(espace.xs) }}>
        <Text style={[d.typo('titre'), styles.texte]}>{formaterPrix(activite.prix, t)}</Text>
        <Text style={[d.typo('corps'), styles.secondaire]}>
          {t.aPied(activite.trajet_min)}
          {SEP}
          {formaterDistance(activite.distance_m, t)}
        </Text>
      </View>
      <Pressable
        onPress={() => Linking.openURL(itineraire)}
        accessibilityRole="link"
        accessibilityLabel={t.fiche.yAllerA11y}
        style={({ pressed }) => [styles.yAller, { minHeight: d.px(56), gap: d.px(espace.s) }, pressed && styles.appuye]}
      >
        <Navigation size={d.px(20)} color={couleurs.surPrimaire} />
        <Text style={[d.typo('sousTitre'), styles.yAllerTexte]}>{t.fiche.yAller}</Text>
      </Pressable>
      {PARTAGE_DISPONIBLE && (
        <Pressable
          onPress={partager}
          accessibilityRole="button"
          accessibilityLabel={t.fiche.partager}
          style={({ pressed }) => [styles.secondaireBouton, { minHeight: d.px(48), gap: d.px(espace.s) }, pressed && styles.appuye]}
        >
          <Share2 size={d.px(18)} color={couleurs.texte} />
          <Text style={[d.typo('corpsFort'), styles.texte]}>{t.fiche.partager}</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.ecran} contentContainerStyle={[styles.page, large && { padding: d.px(espace.xxl) }]}>
      <View style={[styles.colonne, large && styles.colonneLarge]}>
        <View>
          {activite.photo_url ? (
            <Image
              source={{ uri: activite.photo_url }}
              resizeMode="cover"
              accessibilityLabel={activite.photo_alt ?? t.fiche.photo(activite.titre)}
              style={[styles.photo, large && styles.photoLarge, { height: hauteurPhoto }]}
            />
          ) : (
            <View style={[styles.photo, large && styles.photoLarge, styles.sansPhoto, { height: hauteurPhoto }]}>
              {IconeCategorie && <IconeCategorie size={d.px(56)} color={couleurs.texteSecondaire} />}
            </View>
          )}
          {activite.photo_credit && (
            <Text style={[d.typo('legende'), styles.credit, { marginHorizontal: marge, marginTop: d.px(espace.s) }]}>
              {t.fiche.credit(activite.photo_credit)}
            </Text>
          )}
        </View>

        <View style={[large && styles.corpsLarge, { paddingHorizontal: marge, marginTop: d.px(espace.xl) }]}>
          <View style={styles.principal}>
            <View style={[styles.categorie, { gap: d.px(espace.s), marginBottom: d.px(espace.s) }]}>
              <Text style={[d.typo('legende'), styles.categorieTexte]}>{activite.categorieLibelle}</Text>
              {activite.non_traduit && <MentionFrancais />}
            </View>
            <Text accessibilityRole="header" style={[d.typo('affiche'), styles.texte, lecture]}>
              {activite.titre}
            </Text>
            <Text style={[d.typo('corps'), styles.secondaire, { marginTop: d.px(espace.s) }]}>{activite.lieu}</Text>

            <View style={[styles.pourquoi, lecture, { marginTop: d.px(espace.xl), padding: d.px(espace.l), gap: d.px(espace.xs) }]}>
              <Text style={[d.typo('corpsFort'), styles.pourquoiTitre]}>{t.fiche.pourquoi}</Text>
              <Text style={[d.typo('corps'), styles.texte]}>{activite.explication}</Text>
            </View>

            {!large && <View style={{ marginTop: d.px(espace.xl) }}>{action}</View>}

            <View style={[styles.lignes, lecture, { marginTop: d.px(espace.xxl) }]}>
              <Ligne libelle={t.fiche.lieu} valeur={activite.adresse ?? activite.lieu} />
              <Ligne libelle={t.fiche.horaire} valeur={activite.horaires} />
            </View>

            {activite.description && (
              <View style={[lecture, { marginTop: d.px(espace.xxl), gap: d.px(espace.s) }]}>
                <Text accessibilityRole="header" style={[d.typo('sousTitre'), styles.texte]}>
                  {t.fiche.description}
                </Text>
                <Text style={[d.typo('corps'), styles.texte]}>{activite.description}</Text>
              </View>
            )}

            <View style={[styles.pied, { marginTop: d.px(espace.xxl), gap: d.px(espace.m) }]}>
              {activite.source_url && (
                <Pressable
                  onPress={() => Linking.openURL(activite.source_url!)}
                  accessibilityRole="link"
                  accessibilityLabel={t.fiche.voirSur(activite.source)}
                  style={styles.lien}
                >
                  <Text style={[d.typo('corpsFort'), styles.lienTexte]}>{t.fiche.voirSur(activite.source)}</Text>
                  <ArrowUpRight size={d.px(18)} color={couleurs.texte} />
                </Pressable>
              )}
              {SIGNALEMENT_ACTIF && (
                <Pressable onPress={onSignaler} accessibilityRole="button" accessibilityLabel={t.fiche.signaler} style={styles.lien}>
                  <Text style={[d.typo('corpsFort'), styles.lienTexte]}>{t.fiche.signaler}</Text>
                </Pressable>
              )}
              <Text style={[d.typo('legende'), styles.secondaire]}>{t.sourceMaj(activite.source, activite.date_maj)}</Text>
              <BoutonTerminer onPress={onTerminer} />
            </View>
          </View>

          {large && <View style={styles.cote}>{action}</View>}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: couleurs.fond },
  page: { paddingBottom: espace.xxxl },
  colonne: { width: '100%' },
  colonneLarge: { maxWidth: 1120, alignSelf: 'center' },
  photo: { width: '100%', backgroundColor: couleurs.carte },
  photoLarge: { borderRadius: rayons.m },
  sansPhoto: { alignItems: 'center', justifyContent: 'center' },
  credit: { color: couleurs.texteSecondaire, textAlign: 'right' },
  corpsLarge: { flexDirection: 'row', alignItems: 'flex-start', gap: espace.xxxl },
  principal: { flex: 1 },
  cote: { width: 340 },
  categorie: { flexDirection: 'row', alignItems: 'center' },
  categorieTexte: { fontFamily: polices.texteMoyen, color: couleurs.texteSecondaire },
  secondaire: { color: couleurs.texteSecondaire },
  texte: { color: couleurs.texte },
  pourquoi: { backgroundColor: couleurs.carte, borderRadius: rayons.s },
  pourquoiTitre: { fontFamily: polices.titre, color: couleurs.texte },
  lignes: { borderTopWidth: 1, borderColor: couleurs.trait },
  ligne: { flexDirection: 'row', borderBottomWidth: 1, borderColor: couleurs.trait },
  ligneValeur: { flex: 1, color: couleurs.texte, fontVariant: ['tabular-nums'] },
  actionLarge: { borderWidth: 1, borderColor: couleurs.trait, borderRadius: rayons.m, backgroundColor: '#FFFFFF' },
  yAller: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rayons.s,
    backgroundColor: couleurs.primaire,
    paddingHorizontal: espace.xl,
  },
  yAllerTexte: { color: couleurs.surPrimaire },
  secondaireBouton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rayons.s,
    borderWidth: 1,
    borderColor: couleurs.trait,
    paddingHorizontal: espace.xl,
  },
  appuye: { opacity: 0.85 },
  pied: { alignItems: 'flex-start' },
  lien: { flexDirection: 'row', alignItems: 'center', gap: espace.xs, minHeight: 44 },
  lienTexte: { color: couleurs.texte, textDecorationLine: 'underline' },
});
