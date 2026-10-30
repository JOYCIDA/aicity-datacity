import { useState } from 'react';
import { ArrowRight } from 'lucide-react-native';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import BoutonChoix from '../components/BoutonChoix';
import { ICONES_CATEGORIE } from '../components/Icones';
import { interpreter, ErreurApi } from '../api/client';
import { Bouton, EnteteQuestion, Message, Page, useDesign } from '../design';
import { couleurs, espace, polices, rayons } from '../theme';
import { useTextes } from '../i18n';
import { Choix } from '../types/questions';

type Props = {
  choix: Choix<string>[];
  valeurs: string[];
  onBasculer: (valeur: string) => void;
  onAjouter: (valeurs: string[]) => void;
  onSuivant: () => void;
};

// Retour affiché sous le champ « Autre… ».
type Retour = { ok: boolean; message: string };

export default function EcranInterets({ choix, valeurs, onBasculer, onAjouter, onSuivant }: Props) {
  const t = useTextes();
  const d = useDesign();
  const [aEssaye, setAEssaye] = useState(false);
  const [texte, setTexte] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [retour, setRetour] = useState<Retour | null>(null);

  const comprendre = async () => {
    if (texte.trim() === '' || enCours) return;
    setEnCours(true);
    setRetour(null);
    try {
      const { categories } = await interpreter(texte.trim());
      if (categories.length === 0) {
        setRetour({ ok: false, message: t.interets.nonCompris });
      } else {
        onAjouter(categories);
        const libelles = categories.map((c) => choix.find((x) => x.valeur === c)?.libelle ?? c);
        setRetour({ ok: true, message: t.interets.compris(libelles.join(', ')) });
        setTexte('');
      }
    } catch (e) {
      setRetour({ ok: false, message: e instanceof ErreurApi ? e.message : t.erreurs.generique });
    } finally {
      setEnCours(false);
    }
  };

  const suivant = () => {
    if (valeurs.length === 0) {
      setAEssaye(true);
      return;
    }
    onSuivant();
  };

  return (
    <Page pied={<Bouton libelle={t.suivant} a11y={t.suivantA11y} onPress={suivant} />}>
      <EnteteQuestion
        etape={2}
        etapeA11y={t.etape(2)}
        surtitre={t.question(2)}
        titre={t.interets.titre}
        aide={t.interets.aide}
      />

      <View style={styles.grille}>
        {choix.map((c) => (
          <BoutonChoix
            key={c.valeur}
            multiple
            style={styles.case}
            icone={ICONES_CATEGORIE[c.valeur]}
            libelle={c.libelle}
            selectionne={valeurs.includes(c.valeur)}
            onPress={() => onBasculer(c.valeur)}
          />
        ))}
      </View>

      <Text nativeID="libelle-autre" style={[styles.champLibelle, { fontSize: d.texte.corps }]}>
        {t.interets.autreLibelle}
      </Text>
      <View style={styles.ligne}>
        <TextInput
          value={texte}
          onChangeText={setTexte}
          onSubmitEditing={comprendre}
          maxLength={500}
          returnKeyType="done"
          placeholder={t.interets.autrePlaceholder}
          placeholderTextColor={couleurs.texteSecondaire}
          accessibilityLabel={t.interets.autreA11y}
          accessibilityLabelledBy="libelle-autre"
          style={[styles.champ, { minHeight: d.px(56), fontSize: d.texte.choix }]}
        />
        <Pressable
          onPress={comprendre}
          disabled={enCours}
          accessibilityRole="button"
          accessibilityLabel={t.interets.validerA11y}
          accessibilityState={{ disabled: enCours, busy: enCours }}
          style={({ pressed }) => [styles.valider, { width: d.px(56), height: d.px(56) }, pressed && styles.appuye]}
        >
          {enCours ? <ActivityIndicator color={couleurs.fond} /> : <ArrowRight size={d.px(24)} color={couleurs.fond} />}
        </Pressable>
      </View>
      <Text style={[styles.note, { fontSize: d.texte.surtitre }]}>{t.interets.phraseNonEnregistree}</Text>
      {retour && <Message type={retour.ok ? 'succes' : 'erreur'} texte={retour.message} />}

      {aEssaye && valeurs.length === 0 && <Message type="erreur" texte={t.interets.erreur} />}
    </Page>
  );
}

const styles = StyleSheet.create({
  grille: { flexDirection: 'row', flexWrap: 'wrap', columnGap: espace.m, marginBottom: espace.l },
  case: { flexGrow: 1, flexBasis: 240 },
  champLibelle: { fontFamily: polices.texteMoyen, color: couleurs.texte, marginBottom: espace.s },
  ligne: { flexDirection: 'row', gap: espace.s },
  champ: {
    flex: 1,
    borderWidth: 2,
    borderColor: 'rgba(66, 168, 183, 0.55)',
    borderRadius: rayons.m,
    paddingHorizontal: espace.l,
    fontFamily: polices.texteMoyen,
    color: couleurs.texte,
  },
  valider: {
    borderRadius: rayons.m,
    backgroundColor: couleurs.primaire,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appuye: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  note: { fontFamily: polices.texte, color: couleurs.texteSecondaire, marginTop: espace.s },
});
