import { useCallback, useEffect, useState } from 'react';
import { Gift, Layers, MapPin, Tag, type LucideIcon } from 'lucide-react-native';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import EtatChargement from './EtatChargement';
import { ICONES_CATEGORIE } from './Icones';
import { chargerOffresAutour, ErreurApi, OffreApi } from '../api/client';
import { distanceM, Position } from '../utils/position';
import { formaterDistance, formaterPrix } from '../utils/format';
import { couleurs, polices, tailles } from '../theme';
import { useLangue, useTextes } from '../i18n';

type Props = {
  position: Position;
  rayonM: number;
};

type Ligne = { code: string; libelle: string; nombre: number; prixMoyen: number | null };

function Chiffre({ icone: Icone, valeur, libelle }: { icone: LucideIcon; valeur: number; libelle: string }) {
  return (
    <View style={styles.chiffre} accessible accessibilityLabel={`${valeur} ${libelle}`}>
      <Icone size={24} color={couleurs.primaire} />
      <Text style={styles.chiffreValeur}>{valeur}</Text>
      <Text style={styles.chiffreLibelle}>{libelle}</Text>
    </View>
  );
}

// Répartition de toutes les offres autour du citoyen (maquette page 7), pas seulement des 5 proposées.
export default function VueCategories({ position, rayonM }: Props) {
  const t = useTextes();
  const langue = useLangue();
  const large = useWindowDimensions().width >= 900;
  const [offres, setOffres] = useState<OffreApi[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setErreur(null);
    try {
      setOffres(await chargerOffresAutour(position.latitude, position.longitude, rayonM));
    } catch (e) {
      setErreur(e instanceof ErreurApi ? e.message : t.erreurs.generique);
    }
  }, [position, rayonM, t]);

  useEffect(() => {
    charger();
  }, [charger]);

  if (!offres) return <EtatChargement message={t.categories.chargement} erreur={erreur} onReessayer={charger} />;

  const parCode = new Map<string, OffreApi[]>();
  for (const o of offres) parCode.set(o.categorie.code, [...(parCode.get(o.categorie.code) ?? []), o]);
  const lignes: Ligne[] = [...parCode.entries()]
    .map(([code, liste]) => {
      const prix = liste.map((o) => (o.gratuit ? 0 : o.prix)).filter((p): p is number => p !== null);
      return {
        code,
        libelle: langue === 'FR' ? liste[0].categorie.libelleFr : liste[0].categorie.libelleEn,
        nombre: liste.length,
        prixMoyen: prix.length ? Math.round((prix.reduce((s, p) => s + p, 0) / prix.length) * 10) / 10 : null,
      };
    })
    .sort((a, b) => b.nombre - a.nombre);
  const max = Math.max(1, ...lignes.map((l) => l.nombre));
  const libellePrix = (prix: number) => (prix === 0 ? t.gratuit : t.categories.prixMoyen(formaterPrix(prix, t)));
  const gratuites = offres.filter((o) => o.gratuit).length;
  const proches = offres.filter((o) => distanceM(position, o) <= 500).length;

  return (
    <ScrollView style={styles.panneau} contentContainerStyle={styles.contenu}>
      <Text accessibilityRole="header" style={styles.titre}>
        {t.categories.titre}
      </Text>
      <Text style={styles.sousTitre}>{t.categories.sousTitre(formaterDistance(rayonM))}</Text>

      <View style={[styles.corps, large && styles.corpsLarge]}>
        <View style={styles.barres}>
          {lignes.map((l) => {
            const Icone = ICONES_CATEGORIE[l.code];
            return (
              <View
                key={l.code}
                style={styles.ligne}
                accessible
                accessibilityLabel={`${l.libelle} : ${t.categories.activites(l.nombre)}${
                  l.prixMoyen !== null ? `, ${libellePrix(l.prixMoyen)}` : ''
                }`}
              >
                <View style={styles.categorie}>
                  {Icone && <Icone size={20} color={couleurs.texte} />}
                  <Text style={styles.categorieTexte}>{l.libelle}</Text>
                </View>
                <View style={styles.piste}>
                  <View style={[styles.barre, { width: `${(l.nombre / max) * 100}%` }]}>
                    <Text style={styles.barreTexte} numberOfLines={1}>
                      {t.categories.activites(l.nombre)}
                    </Text>
                  </View>
                </View>
                {l.prixMoyen !== null && (
                  <View style={styles.prix}>
                    <Tag size={14} color={couleurs.texte} />
                    <Text style={styles.prixTexte}>{libellePrix(l.prixMoyen)}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={[styles.chiffres, large && styles.chiffresLarge]}>
          <Chiffre icone={Layers} valeur={offres.length} libelle={t.categories.total} />
          <Chiffre icone={Gift} valeur={gratuites} libelle={t.categories.gratuites} />
          <Chiffre icone={MapPin} valeur={proches} libelle={t.categories.proches} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  panneau: { flex: 1, marginTop: 16 },
  contenu: { gap: 8, paddingBottom: 24 },
  titre: { fontFamily: polices.titre, color: couleurs.texte, fontSize: 22 },
  sousTitre: { fontFamily: polices.texte, color: couleurs.texteSecondaire, fontSize: tailles.texte },
  corps: { gap: 16, marginTop: 8 },
  corpsLarge: { flexDirection: 'row', alignItems: 'flex-start' },
  barres: { flex: 1, gap: 12 },
  ligne: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  categorie: { width: 150, flexDirection: 'row', alignItems: 'center', gap: 8 },
  categorieTexte: { fontFamily: polices.texteMoyen, color: couleurs.texte, fontSize: tailles.texte },
  piste: { flexGrow: 1, flexBasis: 160, height: 44, borderRadius: 22, backgroundColor: couleurs.carte },
  barre: {
    minWidth: 150, // le nombre d'activités reste lisible même pour une petite catégorie
    maxWidth: '100%',
    height: 44,
    borderRadius: 22,
    backgroundColor: couleurs.primaire,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  barreTexte: { fontFamily: polices.texteMoyen, color: couleurs.fond, fontSize: tailles.texte },
  prix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    minHeight: 32,
    borderRadius: 16,
    backgroundColor: couleurs.carte,
  },
  prixTexte: { fontFamily: polices.texte, color: couleurs.texte, fontSize: tailles.petit },
  chiffres: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chiffresLarge: { flexDirection: 'column', width: 200 },
  chiffre: {
    flexGrow: 1,
    flexBasis: 100,
    alignItems: 'center',
    gap: 4,
    padding: 16,
    borderRadius: 24,
    backgroundColor: couleurs.carte,
  },
  chiffreValeur: { fontFamily: polices.titre, color: couleurs.texte, fontSize: 36 },
  chiffreLibelle: { fontFamily: polices.texte, color: couleurs.texteSecondaire, fontSize: tailles.texte, textAlign: 'center' },
});
