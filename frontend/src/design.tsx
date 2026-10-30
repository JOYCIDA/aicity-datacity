// Briques de mise en page partagées par tous les écrans (système de design).
import { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, ChevronRight, Info, type LucideIcon } from 'lucide-react-native';
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { couleurs, espace, modeEcran, polices, rayons, tailles, type Mode } from './theme';
import { vibrer } from './animations';

// Facteur d'agrandissement : la borne se lit à un mètre, le reste à 30 cm.
const FACTEUR: Record<Mode, number> = { telephone: 1, bureau: 1, borne: 1.4 };
// Largeur maximale du contenu : au-delà, les lignes deviennent trop longues à lire.
const LARGEUR: Record<'etroite' | 'large', Record<Mode, number>> = {
  etroite: { telephone: 640, bureau: 720, borne: 960 },
  large: { telephone: 1280, bureau: 1280, borne: 1280 },
};

export function useDesign() {
  const { width, height } = useWindowDimensions();
  const mode = modeEcran(width, height);
  const f = FACTEUR[mode];
  const px = (n: number) => Math.round(n * f);
  return {
    mode,
    px,
    texte: {
      surtitre: px(tailles.petit),
      corps: px(tailles.texte),
      choix: px(18),
      intertitre: px(20),
      titre: px(mode === 'telephone' ? 28 : 34),
      affiche: px(mode === 'telephone' ? 34 : 44),
    },
    marge: mode === 'telephone' ? espace.l : px(espace.xxl),
    largeur: (l: 'etroite' | 'large') => LARGEUR[l][mode],
    hauteurBouton: px(56),
  };
}

type PropsPage = {
  children: ReactNode;
  pied?: ReactNode; // bouton principal, toujours visible en bas de l'écran
  largeur?: 'etroite' | 'large';
};

// Page défilante, contenu centré à largeur maximale, pied fixe en bas.
export function Page({ children, pied, largeur = 'etroite' }: PropsPage) {
  const d = useDesign();
  const max = d.largeur(largeur);
  return (
    <View style={styles.page}>
      <ScrollView
        // Sur la borne, le contenu est centré en hauteur : pas de grand vide sous les choix.
        contentContainerStyle={[styles.defilement, { padding: d.marge }, d.mode === 'borne' && styles.centreVertical]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.colonne, { maxWidth: max }]}>{children}</View>
      </ScrollView>
      {pied && (
        <View style={[styles.pied, { paddingHorizontal: d.marge, paddingVertical: espace.m }]}>
          <View style={[styles.colonne, styles.piedContenu, { maxWidth: max }]}>{pied}</View>
        </View>
      )}
    </View>
  );
}

type PropsEntete = { etape: number; surtitre: string; titre: string; aide: string; etapeA11y: string };

// En-tête des 3 questions : progression, surtitre, titre, consigne.
export function EnteteQuestion({ etape, surtitre, titre, aide, etapeA11y }: PropsEntete) {
  const d = useDesign();
  return (
    <View style={{ gap: espace.s, marginBottom: d.px(espace.xl) }}>
      <View style={styles.progression} accessible accessibilityLabel={etapeA11y}>
        {[1, 2, 3].map((n) => (
          <View key={n} style={[styles.segment, n <= etape && styles.segmentActif]} />
        ))}
        <Text style={[styles.compteur, { fontSize: d.texte.surtitre }]}>{etape} / 3</Text>
      </View>
      <Text style={[styles.surtitre, { fontSize: d.texte.surtitre, marginTop: espace.m }]}>{surtitre}</Text>
      <Text accessibilityRole="header" style={[styles.titre, { fontSize: d.texte.titre, lineHeight: d.texte.titre * 1.2 }]}>
        {titre}
      </Text>
      <Text style={[styles.aide, { fontSize: d.texte.corps }]}>{aide}</Text>
    </View>
  );
}

type PropsBouton = {
  libelle: string;
  onPress: () => void;
  a11y?: string;
  icone?: LucideIcon | null; // flèche par défaut ; null pour aucune icône
  variante?: 'primaire' | 'secondaire';
};

export function Bouton({ libelle, onPress, a11y, icone = ChevronRight, variante = 'primaire' }: PropsBouton) {
  const d = useDesign();
  const Icone = icone;
  const primaire = variante === 'primaire';
  return (
    <Pressable
      onPress={() => {
        vibrer('action');
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={a11y ?? libelle}
      style={({ pressed }) => [
        styles.bouton,
        { minHeight: d.hauteurBouton, paddingHorizontal: d.px(28) },
        primaire ? styles.boutonPrimaire : styles.boutonSecondaire,
        pressed && styles.appuye,
      ]}
    >
      <Text style={[styles.boutonTexte, { fontSize: d.texte.choix }, !primaire && styles.boutonTexteSecondaire]}>
        {libelle}
      </Text>
      {Icone && <Icone size={d.px(20)} color={primaire ? couleurs.fond : couleurs.texte} />}
    </Pressable>
  );
}

const ICONES_MESSAGE: Record<'erreur' | 'info' | 'succes', LucideIcon> = {
  erreur: AlertCircle,
  info: Info,
  succes: CheckCircle2,
};

// Message avec icône : une erreur n'est jamais signalée par la couleur seule.
export function Message({ type, texte }: { type: 'erreur' | 'info' | 'succes'; texte: string }) {
  const d = useDesign();
  const Icone = ICONES_MESSAGE[type];
  const couleur = type === 'erreur' ? couleurs.erreur : type === 'succes' ? couleurs.primaire : couleurs.texteSecondaire;
  return (
    <View style={styles.message} accessibilityRole={type === 'info' ? 'text' : 'alert'}>
      <Icone size={d.px(20)} color={couleur} />
      <Text style={[styles.messageTexte, { fontSize: d.texte.corps, color: type === 'succes' ? couleurs.texte : couleur }]}>
        {texte}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  defilement: { flexGrow: 1, alignItems: 'center' },
  centreVertical: { justifyContent: 'center' },
  colonne: { width: '100%' },
  pied: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(66, 168, 183, 0.18)',
    backgroundColor: couleurs.fond,
  },
  piedContenu: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: espace.m },
  progression: { flexDirection: 'row', alignItems: 'center', gap: espace.s },
  segment: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(90, 143, 160, 0.45)' },
  segmentActif: { backgroundColor: couleurs.primaire },
  compteur: { fontFamily: polices.texteMoyen, color: couleurs.texteSecondaire, marginLeft: espace.xs },
  surtitre: { fontFamily: polices.texteMoyen, color: couleurs.primaire, letterSpacing: 1.2, textTransform: 'uppercase' },
  titre: { fontFamily: polices.titre, color: couleurs.texte, letterSpacing: -0.3 },
  aide: { fontFamily: polices.texte, color: couleurs.texteSecondaire },
  bouton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espace.s,
    borderRadius: rayons.pilule,
  },
  boutonPrimaire: { backgroundColor: couleurs.primaire },
  boutonSecondaire: { borderWidth: 2, borderColor: couleurs.primaire },
  boutonTexte: { fontFamily: polices.titre, color: couleurs.fond },
  boutonTexteSecondaire: { color: couleurs.texte },
  appuye: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  message: { flexDirection: 'row', alignItems: 'flex-start', gap: espace.s, marginTop: espace.s },
  messageTexte: { flex: 1, fontFamily: polices.texteMoyen },
});
