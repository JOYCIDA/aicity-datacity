import { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet } from 'react-native';
import BoutonChoix from '../components/BoutonChoix';
import { Activite } from '../types/activite';
import { Signalement, TypeErreur } from '../types/signalement';
import { couleurs, polices, tailles } from '../theme';

const CHOIX: { valeur: TypeErreur; libelle: string }[] = [
  { valeur: 'horaires', libelle: 'Les horaires sont faux' },
  { valeur: 'prix', libelle: 'Le prix est faux' },
  { valeur: 'lieu', libelle: "Le lieu n'est pas le bon" },
  { valeur: 'annule', libelle: "L'activité est annulée" },
  { valeur: 'autre', libelle: 'Autre problème' },
];

type Props = {
  activite: Activite;
  onRetour: () => void;
  onEnvoyer: (signalement: Signalement) => void;
};

export default function EcranSignalement({ activite, onRetour, onEnvoyer }: Props) {
  const [type, setType] = useState<TypeErreur | undefined>();
  const [commentaire, setCommentaire] = useState('');
  const [aEssaye, setAEssaye] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  const envoyer = () => {
    if (!type) {
      setAEssaye(true);
      return;
    }
    onEnvoyer({ activiteId: activite.id, type, commentaire: commentaire.trim() });
    setEnvoye(true);
  };

  if (envoye) {
    return (
      <View style={styles.page}>
        <Text accessibilityRole="header" style={styles.titre}>
          Merci !
        </Text>
        <Text style={styles.texte}>
          Ton signalement concernant « {activite.titre} » a été pris en compte.
        </Text>
        <Pressable
          onPress={onRetour}
          accessibilityRole="button"
          accessibilityLabel="Retour à la fiche"
          style={styles.bouton}
        >
          <Text style={styles.boutonTexte}>Retour à la fiche</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Pressable
        onPress={onRetour}
        accessibilityRole="button"
        accessibilityLabel="Retour à la fiche"
        style={styles.retour}
      >
        <Text style={styles.retourTexte}>‹ Retour à la fiche</Text>
      </Pressable>

      <Text accessibilityRole="header" style={styles.titre}>
        Signaler une information erronée
      </Text>
      <Text style={styles.texte}>À propos de : {activite.titre}</Text>

      <Text style={styles.libelle}>Quel est le problème ?</Text>
      <View accessibilityRole="radiogroup">
        {CHOIX.map((c) => (
          <BoutonChoix
            key={c.valeur}
            libelle={c.libelle}
            selectionne={type === c.valeur}
            onPress={() => setType(c.valeur)}
          />
        ))}
      </View>

      {aEssaye && !type && (
        <View style={styles.erreur} accessibilityRole="alert">
          <Text style={styles.erreurIcone}>⚠</Text>
          <Text style={styles.erreurTexte}>Choisis le type de problème pour continuer.</Text>
        </View>
      )}

      <Text style={styles.libelle}>Précisions (facultatif)</Text>
      <TextInput
        value={commentaire}
        onChangeText={setCommentaire}
        multiline
        accessibilityLabel="Précisions, facultatif"
        placeholder="Ex. : l'événement commence à 21h, pas 20h"
        placeholderTextColor={couleurs.texteSecondaire}
        style={styles.champ}
      />
      <Text style={styles.aide}>Ne mets pas de données personnelles.</Text>

      <Pressable
        onPress={envoyer}
        accessibilityRole="button"
        accessibilityLabel="Envoyer le signalement"
        style={styles.bouton}
      >
        <Text style={styles.boutonTexte}>Envoyer le signalement</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingBottom: 32 },
  retour: {
    alignSelf: 'flex-start',
    minHeight: tailles.zoneMin,
    justifyContent: 'center',
    marginBottom: 8,
  },
  retourTexte: { fontFamily: polices.texteMoyen, color: couleurs.texte, fontSize: 18 },
  titre: { fontFamily: polices.titre, color: couleurs.texte, fontSize: 28 },
  texte: {
    fontFamily: polices.texte,
    color: couleurs.texte,
    fontSize: tailles.texte,
    marginTop: 8,
  },
  libelle: {
    fontFamily: polices.texteMoyen,
    color: couleurs.texte,
    fontSize: 18,
    marginTop: 24,
    marginBottom: 8,
  },
  champ: {
    minHeight: 96,
    backgroundColor: couleurs.carte,
    borderWidth: 2,
    borderColor: couleurs.primaire,
    borderRadius: 16,
    padding: 12,
    color: couleurs.texte,
    fontFamily: polices.texte,
    fontSize: tailles.texte,
    textAlignVertical: 'top',
  },
  aide: {
    fontFamily: polices.texte,
    color: couleurs.texteSecondaire,
    fontSize: tailles.texte,
    marginTop: 8,
  },
  erreur: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  erreurIcone: { color: couleurs.erreur, fontSize: 20 },
  erreurTexte: { fontFamily: polices.texteMoyen, color: couleurs.erreur, fontSize: tailles.texte },
  bouton: {
    minHeight: 60,
    borderRadius: 30,
    backgroundColor: couleurs.primaire,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  boutonTexte: { fontFamily: polices.titre, color: couleurs.fond, fontSize: 20 },
});