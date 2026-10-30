import { Clock, ExternalLink, MapPin, Navigation, Share2, Tag, type LucideIcon } from 'lucide-react-native';
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
  useWindowDimensions,
} from 'react-native';
import { Activite } from '../types/activite';
import { colors } from '../theme/tokens';
import { polices, tailles } from '../theme';
import { formaterPrix, formaterDistance } from '../utils/format';
import { ICONES_CATEGORIE } from '../components/Icones';
import { useTextes } from '../i18n';
import { SIGNALEMENT_ACTIF } from '../config';
import BoutonTerminer from '../components/BoutonTerminer';

type Props = {
  activite: Activite;
  onSignaler: () => void;
  onTerminer: () => void;
};

// Sur le web, le partage n'existe que si le navigateur le propose.
const PARTAGE_DISPONIBLE =
  Platform.OS !== 'web' || (typeof navigator !== 'undefined' && typeof navigator.share === 'function');

function Tuile({ icone: Icone, libelle, valeur, accent = false }: {
  icone: LucideIcon;
  libelle: string;
  valeur: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.tuile} accessible accessibilityLabel={`${libelle} : ${valeur}`}>
      <View style={[styles.tuileIcone, accent && styles.tuileIconeAccent]}>
        <Icone size={20} color={colors.night} />
      </View>
      <View style={styles.tuileTextes}>
        <Text style={styles.tuileLibelle}>{libelle}</Text>
        <Text style={styles.tuileValeur}>{valeur}</Text>
      </View>
    </View>
  );
}

export default function EcranFiche({ activite, onSignaler, onTerminer }: Props) {
  const t = useTextes();
  const large = useWindowDimensions().width >= 768;
  const IconeCategorie = ICONES_CATEGORIE[activite.categorie];
  const itineraire = `https://www.google.com/maps/dir/?api=1&destination=${activite.lat},${activite.lng}&travelmode=walking`;

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

  return (
    <ScrollView style={styles.ecran} contentContainerStyle={[styles.page, large && styles.pageLarge]}>
      {activite.photo_url ? (
        <View style={large ? styles.photoLarge : styles.photo}>
          <Image
            source={{ uri: activite.photo_url }}
            resizeMode="cover"
            accessibilityLabel={activite.photo_alt ?? t.fiche.photo(activite.titre)}
            style={styles.image}
          />
          {activite.photo_credit && (
            <Text style={styles.credit} accessibilityLabel={t.fiche.credit(activite.photo_credit)}>
              © {activite.photo_credit}
            </Text>
          )}
        </View>
      ) : (
        <View style={[large ? styles.photoLarge : styles.photo, styles.sansPhoto]}>
          {IconeCategorie && <IconeCategorie size={64} color={colors.teal} />}
        </View>
      )}

      <View style={styles.contenu}>
        <View style={styles.pastille}>
          {IconeCategorie && <IconeCategorie size={16} color={colors.night} />}
          <Text style={styles.pastilleTexte}>{activite.categorieLibelle}</Text>
        </View>
        <Text accessibilityRole="header" style={styles.titre}>
          {activite.titre}
        </Text>
        <Text style={styles.sousTitre}>{activite.lieu}</Text>

        <View style={styles.pourquoi}>
          <Text accessibilityRole="header" style={styles.pourquoiTitre}>
            {t.fiche.pourquoi}
          </Text>
          <Text style={styles.texte}>{activite.explication}</Text>
        </View>

        <View style={styles.tuiles}>
          <Tuile icone={MapPin} libelle={t.fiche.lieu} valeur={activite.adresse ?? activite.lieu} />
          <Tuile icone={Clock} libelle={t.fiche.horaire} valeur={activite.horaires} />
          <Tuile icone={Tag} libelle={t.fiche.prix} valeur={formaterPrix(activite.prix, t)} />
          <Tuile
            icone={Navigation}
            accent
            libelle={t.fiche.distance}
            valeur={`${formaterDistance(activite.distance_m)} · ${t.aPied(activite.trajet_min)}`}
          />
        </View>

        {activite.description && (
          <View>
            <Text accessibilityRole="header" style={styles.sectionTitre}>
              {t.fiche.description}
            </Text>
            <Text style={styles.texte}>{activite.description}</Text>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            onPress={() => Linking.openURL(itineraire)}
            accessibilityRole="link"
            accessibilityLabel={t.fiche.yAllerA11y}
            style={styles.yAller}
          >
            <Navigation size={24} color={colors.night} />
            <Text style={styles.yAllerTexte}>{t.fiche.yAller}</Text>
          </Pressable>
          {PARTAGE_DISPONIBLE && (
            <Pressable
              onPress={partager}
              accessibilityRole="button"
              accessibilityLabel={t.fiche.partager}
              style={styles.partager}
            >
              <Share2 size={20} color={colors.night} />
              <Text style={styles.partagerTexte}>{t.fiche.partager}</Text>
            </Pressable>
          )}
        </View>

        {activite.source_url && (
          <Pressable
            onPress={() => Linking.openURL(activite.source_url!)}
            accessibilityRole="link"
            accessibilityLabel={t.fiche.voirSur(activite.source)}
            style={styles.lien}
          >
            <Text style={styles.lienTexte}>{t.fiche.voirSur(activite.source)}</Text>
            <ExternalLink size={18} color={colors.night} />
          </Pressable>
        )}

        {SIGNALEMENT_ACTIF && (
          <Pressable
            onPress={onSignaler}
            accessibilityRole="button"
            accessibilityLabel={t.fiche.signaler}
            style={styles.lien}
          >
            <Text style={styles.lienTexte}>{t.fiche.signaler}</Text>
          </Pressable>
        )}

        <Text style={styles.source}>{t.sourceMaj(activite.source, activite.date_maj)}</Text>

        <BoutonTerminer onPress={onTerminer} clair />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: colors.background },
  page: { padding: 16, paddingBottom: 32, gap: 20 },
  pageLarge: { flexDirection: 'row', alignItems: 'flex-start', padding: 24, gap: 32 },
  photo: { width: '100%', height: 220, borderRadius: 24, overflow: 'hidden' },
  photoLarge: { width: '38%', aspectRatio: 3 / 4, borderRadius: 24, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  // Bandeau sombre en bas de la photo : lisible quelle que soit l'image.
  credit: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(8, 43, 56, 0.8)',
    color: colors.nightForeground,
    fontFamily: polices.texte,
    fontSize: tailles.petit,
  },
  sansPhoto: { backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  contenu: { flex: 1, gap: 16 },
  pastille: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: colors.tealLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pastilleTexte: { fontFamily: polices.texteMoyen, fontSize: tailles.petit, color: colors.night },
  titre: { fontFamily: polices.titre, color: colors.night, fontSize: 32, lineHeight: 38 },
  sousTitre: { fontFamily: polices.texte, color: colors.mutedForeground, fontSize: 18, marginTop: -8 },
  pourquoi: {
    borderWidth: 2,
    borderColor: colors.teal,
    borderRadius: 24,
    padding: 16,
    gap: 6,
  },
  pourquoiTitre: { fontFamily: polices.titre, color: colors.night, fontSize: 20 },
  texte: { fontFamily: polices.texte, color: colors.night, fontSize: tailles.texte, lineHeight: 24 },
  tuiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tuile: {
    // 2 colonnes sur grand écran (comme la maquette), 1 sur téléphone.
    flexGrow: 1,
    flexBasis: '40%',
    minWidth: 220,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.muted,
    borderRadius: 24,
    padding: 16,
  },
  tuileIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tuileIconeAccent: { backgroundColor: colors.teal },
  tuileTextes: { flex: 1, gap: 2 },
  tuileLibelle: { fontFamily: polices.texte, color: colors.night, fontSize: tailles.petit },
  tuileValeur: { fontFamily: polices.texteMoyen, color: colors.night, fontSize: tailles.texte },
  sectionTitre: { fontFamily: polices.titre, color: colors.night, fontSize: 20, marginBottom: 6 },
  actions: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  yAller: {
    flexGrow: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 64,
    borderRadius: 32,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  yAllerTexte: { fontFamily: polices.titre, color: colors.night, fontSize: 22 },
  partager: {
    flexDirection: 'row',
    gap: 8,
    minHeight: 64,
    borderRadius: 32,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  partagerTexte: { fontFamily: polices.texteMoyen, color: colors.night, fontSize: tailles.texte },
  lien: {
    flexDirection: 'row',
    gap: 8,
    minHeight: tailles.zoneMin,
    borderWidth: 2,
    borderColor: colors.teal,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  lienTexte: { fontFamily: polices.texteMoyen, color: colors.night, fontSize: tailles.texte },
  source: { fontFamily: polices.texte, color: colors.mutedForeground, fontSize: tailles.petit },
});
