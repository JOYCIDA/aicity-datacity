import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react-native';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import AiCityLogo from '../components/AiCityLogo';
import CitySkyline from '../components/CitySkyline';
import { RETOUR_ACCUEIL_SECONDES } from '../config';
import { sombre, rayons, typo } from '../theme';
import { useTextes } from '../i18n';

type Props = {
  onAccueil: () => void;
};

export default function EcranFin({ onAccueil }: Props) {
  const t = useTextes();
  const [reste, setReste] = useState(RETOUR_ACCUEIL_SECONDES);

  useEffect(() => {
    if (reste === 0) {
      onAccueil();
      return;
    }
    const minuteur = setTimeout(() => setReste(reste - 1), 1000);
    return () => clearTimeout(minuteur);
  }, [reste, onAccueil]);

  return (
    <View style={styles.ecran}>
      <ScrollView contentContainerStyle={styles.page}>
        <AiCityLogo size="md" dark />

        <Text accessibilityRole="header" style={styles.titre}>
          {t.fin.titre}
        </Text>
        <Text style={styles.texte}>{t.fin.texte}</Text>

        {/* Le lecteur d'écran n'annonce pas chaque seconde : seulement le texte complet. */}
        <View style={styles.compteur} accessible accessibilityLabel={t.fin.retourAuto(reste)}>
          <Text style={styles.compteurChiffre}>{reste}</Text>
        </View>
        <Text style={styles.retourAuto} importantForAccessibility="no-hide-descendants">
          {t.fin.retourAuto(reste)}
        </Text>

        <Pressable
          onPress={onAccueil}
          accessibilityRole="button"
          accessibilityLabel={t.fin.revenir}
          style={styles.bouton}
        >
          <Text style={styles.boutonTexte}>{t.fin.revenir}</Text>
        </Pressable>

        <View style={styles.badge}>
          <ShieldCheck size={18} color={sombre.primaire} />
          <Text style={styles.badgeTexte}>{t.fin.badge}</Text>
        </View>
      </ScrollView>

      <CitySkyline />
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: sombre.fond },
  page: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 16 },
  titre: { ...typo.affiche, color: sombre.texte, textAlign: 'center' },
  texte: {
    ...typo.corps,
    color: sombre.texteSecondaire,
    textAlign: 'center',
    maxWidth: 460,
  },
  compteur: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: sombre.primaire,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  compteurChiffre: { ...typo.affiche, color: sombre.texte, fontVariant: ['tabular-nums'] },
  retourAuto: {
    ...typo.corps,
    color: sombre.texteSecondaire,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  bouton: {
    flexDirection: 'row',
    gap: 10,
    minHeight: 64,
    paddingHorizontal: 32,
    borderRadius: rayons.s,
    backgroundColor: sombre.primaire,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  boutonTexte: { ...typo.sousTitre, color: sombre.surPrimaire },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: rayons.s,
    backgroundColor: sombre.carte,
  },
  badgeTexte: { flexShrink: 1, ...typo.legende, color: sombre.texteSecondaire },
});
