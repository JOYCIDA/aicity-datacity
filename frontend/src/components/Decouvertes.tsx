import { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { chargerOffresDecouverte, OffreApi } from '../api/client';
import { POSITION_PAR_DEFAUT } from '../config';
import { Langue, useTextes } from '../i18n';
import { sombre, polices, rayons, typo } from '../theme';
import { formaterPrix, SEP } from '../utils/format';
import { positionSansDemander } from '../utils/position';

type Props = {
  langue: Langue; // recharge les titres dans la bonne langue
  echelle: number; // agrandissement sur la borne
  onOuvrir: (offre: OffreApi) => void;
};

const NOMBRE = 10;
const MINIMUM = 4; // en dessous, la rangée ferait vide : on ne l'affiche pas
const SEMAINE_MS = 7 * 24 * 3600 * 1000;

// Offres avec photo, ouvertes maintenant ou dans la semaine, en alternant les catégories.
export function choisirDecouvertes(offres: OffreApi[], maintenant = Date.now()): OffreApi[] {
  const parCategorie = new Map<string, OffreApi[]>();
  for (const o of offres) {
    if (!o.photoUrl || Date.parse(o.debut) > maintenant + SEMAINE_MS) continue;
    const liste = parCategorie.get(o.categorie.code) ?? [];
    if (!liste.some((x) => x.titre === o.titre)) liste.push(o);
    parCategorie.set(o.categorie.code, liste);
  }
  const files = [...parCategorie.values()];
  const choix: OffreApi[] = [];
  for (let rang = 0; choix.length < NOMBRE && files.some((f) => f.length > rang); rang++) {
    for (const f of files) if (f[rang] && choix.length < NOMBRE) choix.push(f[rang]);
  }
  return choix;
}

export default function Decouvertes({ langue, echelle, onOuvrir }: Props) {
  const t = useTextes();
  const [offres, setOffres] = useState<OffreApi[]>([]);
  const z = (n: number) => Math.round(n * echelle);

  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        // Aucune demande d'autorisation sur l'accueil : position réelle seulement si déjà permise.
        const position = (await positionSansDemander()) ?? POSITION_PAR_DEFAUT;
        const liste = await chargerOffresDecouverte(position.latitude, position.longitude);
        if (!annule) setOffres(choisirDecouvertes(liste));
      } catch {
        if (!annule) setOffres([]); // rangée facultative : en cas d'erreur, l'accueil reste utilisable
      }
    })();
    return () => {
      annule = true;
    };
  }, [langue]);

  if (offres.length < MINIMUM) return null;

  const largeur = z(220);
  return (
    <View style={[styles.bloc, { gap: z(12) }]}>
      <Text accessibilityRole="header" style={[styles.titre, { fontSize: z(16), lineHeight: z(24) }]}>
        {t.decouverte.titre}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.rangee, { gap: z(12) }]}
        accessibilityRole="list"
      >
        {offres.map((o) => {
          const categorie = langue === 'FR' ? o.categorie.libelleFr : o.categorie.libelleEn;
          // Prix seulement s'il est connu : « Prix non communiqué » n'aide pas à choisir.
          const prix = o.gratuit || o.prix !== null ? formaterPrix(o.gratuit ? 0 : o.prix, t) : null;
          const infos = prix ? `${categorie}${SEP}${prix}` : categorie;
          return (
            <Pressable
              key={o.id}
              onPress={() => onOuvrir(o)}
              accessibilityRole="button"
              accessibilityLabel={`${o.titre}, ${infos}`}
              style={({ pressed }) => [styles.carte, { width: largeur }, pressed && styles.appuyee]}
            >
              <Image
                source={{ uri: o.photoUrl! }}
                resizeMode="cover"
                accessible={false}
                style={{ width: largeur, height: Math.round(largeur * 0.62) }}
              />
              <View style={[styles.texte, { padding: z(12), gap: z(4) }]}>
                <Text numberOfLines={2} style={[styles.carteTitre, { fontSize: z(16), lineHeight: z(22) }]}>
                  {o.titre}
                </Text>
                <Text numberOfLines={1} style={[styles.carteInfo, { fontSize: z(14), lineHeight: z(20) }]}>
                  {infos}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Pleine largeur (annule la marge de la page) : la rangée glisse d'un bord à l'autre.
  bloc: { alignSelf: 'stretch', marginHorizontal: -16 },
  titre: { ...typo.corpsFort, color: sombre.texteSecondaire, textAlign: 'center' },
  // Les cartes dépassent à droite : on voit qu'il y en a d'autres en faisant glisser.
  rangee: { paddingHorizontal: 16 },
  carte: { backgroundColor: sombre.carte, borderRadius: rayons.s, overflow: 'hidden' },
  appuyee: { opacity: 0.85 },
  texte: { flex: 1 },
  carteTitre: { fontFamily: polices.titre, color: sombre.texte },
  carteInfo: { fontFamily: polices.texte, color: sombre.texteSecondaire },
});
