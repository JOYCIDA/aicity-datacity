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
import { clair, typo } from '../theme';
import { formaterPrix, formaterDistance } from '../utils/format';
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
    <View style={[styles.ligne, { paddingVertical: d.px(14) }]} accessible accessibilityLabel={`${libelle} : ${valeur}`}>
      <Text style={[styles.ligneLibelle, { fontSize: d.px(15), width: d.px(110) }]}>{libelle}</Text>
      <Text style={[styles.ligneValeur, { fontSize: d.px(16), lineHeight: d.px(23) }]}>{valeur}</Text>
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
  const marge = large ? 0 : d.px(20);

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
    <View style={[styles.action, large && styles.actionLarge, { padding: large ? d.px(24) : 0, gap: d.px(16) }]}>
      <View>
        <Text style={[styles.prix, { fontSize: d.px(26) }]}>{formaterPrix(activite.prix, t)}</Text>
        <Text style={[styles.secondaire, { fontSize: d.px(16), marginTop: d.px(2) }]}>
          {t.aPied(activite.trajet_min)} · {formaterDistance(activite.distance_m)}
        </Text>
      </View>
      <Pressable
        onPress={() => Linking.openURL(itineraire)}
        accessibilityRole="link"
        accessibilityLabel={t.fiche.yAllerA11y}
        style={({ pressed }) => [styles.yAller, { minHeight: d.px(56) }, pressed && styles.appuye]}
      >
        <Navigation size={d.px(20)} color={clair.encre} />
        <Text style={[styles.yAllerTexte, { fontSize: d.px(18) }]}>{t.fiche.yAller}</Text>
      </Pressable>
      {PARTAGE_DISPONIBLE && (
        <Pressable
          onPress={partager}
          accessibilityRole="button"
          accessibilityLabel={t.fiche.partager}
          style={({ pressed }) => [styles.secondaireBouton, { minHeight: d.px(48) }, pressed && styles.appuye]}
        >
          <Share2 size={d.px(18)} color={clair.encre} />
          <Text style={[styles.secondaireBoutonTexte, { fontSize: d.px(16) }]}>{t.fiche.partager}</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.ecran} contentContainerStyle={[styles.page, large && { padding: d.px(32) }]}>
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
              {IconeCategorie && <IconeCategorie size={d.px(56)} color={clair.secondaire} />}
            </View>
          )}
          {activite.photo_credit && (
            <Text style={[styles.credit, { fontSize: d.px(13), marginHorizontal: marge }]}>
              {t.fiche.credit(activite.photo_credit)}
            </Text>
          )}
        </View>

        <View style={[styles.corps, large && styles.corpsLarge, { paddingHorizontal: marge, marginTop: d.px(24) }]}>
          <View style={styles.principal}>
            <View style={styles.categorie}>
              <Text style={[styles.categorieTexte, { fontSize: d.px(15) }]}>{activite.categorieLibelle}</Text>
              {activite.non_traduit && <MentionFrancais />}
            </View>
            <Text
              accessibilityRole="header"
              style={[styles.titre, { fontSize: d.px(large ? 40 : 30), lineHeight: d.px(large ? 46 : 36) }]}
            >
              {activite.titre}
            </Text>
            <Text style={[styles.secondaire, { fontSize: d.px(17), marginTop: d.px(6) }]}>{activite.lieu}</Text>

            <View style={[styles.pourquoi, { marginTop: d.px(24), padding: d.px(16) }]}>
              <Text style={[styles.pourquoiTitre, { fontSize: d.px(15) }]}>{t.fiche.pourquoi}</Text>
              <Text style={[styles.texte, { fontSize: d.px(16), lineHeight: d.px(24) }]}>{activite.explication}</Text>
            </View>

            {!large && <View style={{ marginTop: d.px(24) }}>{action}</View>}

            <View style={[styles.lignes, { marginTop: d.px(28) }]}>
              <Ligne libelle={t.fiche.lieu} valeur={activite.adresse ?? activite.lieu} />
              <Ligne libelle={t.fiche.horaire} valeur={activite.horaires} />
            </View>

            {activite.description && (
              <View style={{ marginTop: d.px(32) }}>
                <Text accessibilityRole="header" style={[styles.intertitre, { fontSize: d.px(20), marginBottom: d.px(8) }]}>
                  {t.fiche.description}
                </Text>
                <Text style={[styles.texte, { fontSize: d.px(16), lineHeight: d.px(26) }]}>{activite.description}</Text>
              </View>
            )}

            <View style={[styles.pied, { marginTop: d.px(32), gap: d.px(12) }]}>
              {activite.source_url && (
                <Pressable
                  onPress={() => Linking.openURL(activite.source_url!)}
                  accessibilityRole="link"
                  accessibilityLabel={t.fiche.voirSur(activite.source)}
                  style={styles.lien}
                >
                  <Text style={[styles.lienTexte, { fontSize: d.px(16) }]}>{t.fiche.voirSur(activite.source)}</Text>
                  <ArrowUpRight size={d.px(18)} color={clair.encre} />
                </Pressable>
              )}
              {SIGNALEMENT_ACTIF && (
                <Pressable onPress={onSignaler} accessibilityRole="button" accessibilityLabel={t.fiche.signaler} style={styles.lien}>
                  <Text style={[styles.lienTexte, { fontSize: d.px(16) }]}>{t.fiche.signaler}</Text>
                </Pressable>
              )}
              <Text style={[styles.secondaire, { fontSize: d.px(14) }]}>{t.sourceMaj(activite.source, activite.date_maj)}</Text>
              <BoutonTerminer onPress={onTerminer} clair />
            </View>
          </View>

          {large && <View style={styles.cote}>{action}</View>}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: clair.fond },
  page: { paddingBottom: 48 },
  colonne: { width: '100%' },
  colonneLarge: { maxWidth: 1120, alignSelf: 'center' },
  photo: { width: '100%', backgroundColor: clair.surface },
  photoLarge: { borderRadius: 16 },
  sansPhoto: { alignItems: 'center', justifyContent: 'center' },
  credit: { fontFamily: typo.normal, color: clair.secondaire, marginTop: 8, textAlign: 'right' },
  corps: {},
  corpsLarge: { flexDirection: 'row', alignItems: 'flex-start', gap: 56 },
  principal: { flex: 1 },
  cote: { width: 340 },
  categorie: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  categorieTexte: { fontFamily: typo.moyen, color: clair.secondaire },
  titre: { fontFamily: typo.fort, color: clair.encre, letterSpacing: -0.6 },
  secondaire: { fontFamily: typo.normal, color: clair.secondaire },
  texte: { fontFamily: typo.normal, color: clair.encre },
  intertitre: { fontFamily: typo.fort, color: clair.encre, letterSpacing: -0.2 },
  pourquoi: { backgroundColor: clair.surface, borderRadius: 12, gap: 4 },
  pourquoiTitre: { fontFamily: typo.fort, color: clair.encre },
  lignes: { borderTopWidth: 1, borderColor: clair.trait },
  ligne: { flexDirection: 'row', gap: 16, borderBottomWidth: 1, borderColor: clair.trait },
  ligneLibelle: { fontFamily: typo.normal, color: clair.secondaire },
  ligneValeur: { flex: 1, fontFamily: typo.moyen, color: clair.encre },
  action: {},
  actionLarge: { borderWidth: 1, borderColor: clair.trait, borderRadius: 16, backgroundColor: '#FFFFFF' },
  prix: { fontFamily: typo.fort, color: clair.encre, letterSpacing: -0.4 },
  yAller: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 12,
    backgroundColor: clair.accent,
    paddingHorizontal: 20,
  },
  yAllerTexte: { fontFamily: typo.fort, color: clair.encre },
  secondaireBouton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: clair.trait,
    paddingHorizontal: 20,
  },
  secondaireBoutonTexte: { fontFamily: typo.moyen, color: clair.encre },
  appuye: { opacity: 0.85 },
  pied: { alignItems: 'flex-start' },
  lien: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 },
  lienTexte: { fontFamily: typo.moyen, color: clair.encre, textDecorationLine: 'underline' },
});
