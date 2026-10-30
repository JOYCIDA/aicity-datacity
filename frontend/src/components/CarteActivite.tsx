import { Clock, MapPin, Navigation, Tag, type LucideIcon } from 'lucide-react-native';
import { Pressable, View, Text, Image, StyleSheet } from 'react-native';
import { Activite } from '../types/activite';
import { colors } from '../theme/tokens';
import { polices, tailles } from '../theme';
import { formaterPrix, formaterDistance } from '../utils/format';
import { ICONES_CATEGORIE } from './Icones';
import { useTextes } from '../i18n';

type Props = {
  activite: Activite;
  numero?: number; // même numéro que la pastille sur la carte
  onPress?: () => void;
};

function Ligne({ icone: Icone, texte, accent = false }: { icone: LucideIcon; texte: string; accent?: boolean }) {
  return (
    <View style={styles.ligne}>
      <Icone size={16} color={accent ? colors.teal : colors.night} />
      <Text style={styles.ligneTexte}>{texte}</Text>
    </View>
  );
}

export default function CarteActivite({ activite, numero, onPress }: Props) {
  const t = useTextes();
  const prix = formaterPrix(activite.prix, t);
  const distance = `${formaterDistance(activite.distance_m)} · ${t.aPied(activite.trajet_min)}`;
  const IconeCategorie = ICONES_CATEGORIE[activite.categorie];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${numero ? `${numero}. ` : ''}${activite.titre}, ${activite.categorieLibelle}, ${activite.lieu}, ${activite.horaires}, ${prix}, ${distance}`}
      style={({ pressed }) => [styles.carte, pressed && styles.carteAppuyee]}
    >
      {activite.photo_url ? (
        <Image source={{ uri: activite.photo_url }} resizeMode="cover" style={styles.photo} accessible={false} />
      ) : (
        <View style={[styles.photo, styles.sansPhoto]}>
          {IconeCategorie && <IconeCategorie size={36} color={colors.teal} />}
        </View>
      )}

      {numero !== undefined && (
        <View style={styles.numero}>
          <Text style={styles.numeroTexte}>{numero}</Text>
        </View>
      )}

      <View style={styles.contenu}>
        <Text style={styles.titre} numberOfLines={3}>
          {activite.titre}
        </Text>
        <Text style={styles.categorie}>{activite.categorieLibelle}</Text>
        <Ligne icone={MapPin} texte={activite.lieu} />
        <Ligne icone={Clock} texte={activite.horaires} />
        <Ligne icone={Tag} texte={prix} />
        <Ligne icone={Navigation} texte={distance} accent />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: {
    flexDirection: 'row',
    minHeight: 160,
    backgroundColor: colors.background,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  carteAppuyee: { borderColor: colors.teal },
  photo: { width: '34%', minHeight: 160 },
  sansPhoto: { backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  contenu: { flex: 1, padding: 12, gap: 4 },
  numero: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.night,
    borderWidth: 2,
    borderColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroTexte: { fontFamily: polices.titre, color: colors.cream, fontSize: tailles.texte },
  titre: { fontFamily: polices.titre, fontSize: 18, lineHeight: 22, color: colors.night },
  categorie: { fontFamily: polices.texte, fontSize: tailles.petit, color: colors.mutedForeground, marginBottom: 2 },
  ligne: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  // 16 px minimum pour le texte courant (accessibilité), même si la maquette est plus petite.
  ligneTexte: { flex: 1, fontFamily: polices.texte, fontSize: tailles.texte, lineHeight: 22, color: colors.night },
});
