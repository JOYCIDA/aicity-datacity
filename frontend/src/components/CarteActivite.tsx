import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Activite } from '../types/activite';
import { couleurs, polices, tailles } from '../theme';
import { formaterPrix, formaterDistance } from '../utils/format';

type Props = {
  activite: Activite;
  onPress?: () => void;
};

export default function CarteActivite({ activite, onPress }: Props) {
  const prix = formaterPrix(activite.prix);
  const distance = `${formaterDistance(activite.distance_m)} · ${activite.trajet_min} min à pied`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${activite.titre}, ${activite.categorieLibelle}, ${activite.lieu}, ${activite.horaires}, ${prix}, à ${distance}`}
      style={styles.carte}
    >
      <Text style={styles.categorie}>{activite.categorieLibelle}</Text>
      <Text accessibilityRole="header" style={styles.titre}>
        {activite.titre}
      </Text>

      <Text style={styles.ligne}>{activite.lieu}</Text>
      <Text style={styles.ligne}>{activite.horaires}</Text>

      <View style={styles.pied}>
        <Text style={styles.prix}>{prix}</Text>
        <Text style={styles.distance}>{distance}</Text>
      </View>

      <Text style={styles.source}>
        Source : {activite.source} · Mis à jour le {activite.date_maj}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: {
    minHeight: tailles.zoneMin,
    backgroundColor: couleurs.texte, // fond clair, texte foncé : contraste élevé
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
  },
  categorie: {
    fontFamily: polices.texteMoyen,
    fontSize: tailles.petit,
    color: couleurs.fond,
    marginBottom: 4,
  },
  titre: {
    fontFamily: polices.titre,
    fontSize: 22,
    color: couleurs.fond,
    marginBottom: 8,
  },
  ligne: {
    fontFamily: polices.texte,
    fontSize: tailles.texte,
    color: couleurs.fond,
    marginBottom: 2,
  },
  pied: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  prix: { fontFamily: polices.texteMoyen, fontSize: tailles.texte, color: couleurs.fond },
  distance: { fontFamily: polices.texteMoyen, fontSize: tailles.texte, color: couleurs.fond },
  source: {
    fontFamily: polices.texte,
    fontSize: tailles.petit,
    color: couleurs.fond,
    marginTop: 10,
  },
});