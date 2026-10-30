import { useState } from 'react';
import { ShieldCheck } from 'lucide-react-native';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import BoutonChoix from '../components/BoutonChoix';
import { iconeBudget } from '../components/Icones';
import { Bouton, EnteteQuestion, Message, Page, useDesign } from '../design';
import { couleurs, espace, polices, rayons } from '../theme';
import { useTextes } from '../i18n';
import { Budget } from '../types/parcours';
import { Choix, SaisieLibre } from '../types/questions';

type Props = {
  choix: Choix<Budget>[];
  saisieLibre: SaisieLibre | null;
  valeur?: Budget;
  onChoisir: (b: Budget | undefined) => void;
  onSuivant: () => void;
};

// Montant en euros avec au plus 2 décimales, virgule ou point.
const FORMAT_MONTANT = /^\d+([.,]\d{1,2})?$/;

export default function EcranBudget({ choix, saisieLibre, valeur, onChoisir, onSuivant }: Props) {
  const t = useTextes();
  const d = useDesign();
  const [aEssaye, setAEssaye] = useState(false);
  const montantLibre = valeur !== undefined && !choix.some((c) => c.valeur === valeur);
  const [texte, setTexte] = useState(montantLibre ? String(valeur).replace('.', ',') : '');

  const montant = Number(texte.trim().replace(',', '.'));
  const texteInvalide =
    saisieLibre !== null &&
    texte.trim() !== '' &&
    (!FORMAT_MONTANT.test(texte.trim()) || montant < saisieLibre.min || montant > saisieLibre.max);

  const saisir = (saisie: string) => {
    setTexte(saisie);
    const m = Number(saisie.trim().replace(',', '.'));
    const valide =
      saisieLibre !== null && FORMAT_MONTANT.test(saisie.trim()) && m >= saisieLibre.min && m <= saisieLibre.max;
    onChoisir(valide ? m : undefined);
  };

  const choisir = (b: Budget) => {
    setTexte('');
    onChoisir(b);
  };

  const suivant = () => {
    if (valeur === undefined) {
      setAEssaye(true);
      return;
    }
    onSuivant();
  };

  return (
    <Page
      pied={
        <>
          <View style={styles.confidentialite}>
            <ShieldCheck size={d.px(18)} color={couleurs.primaire} />
            <Text style={[styles.confidentialiteTexte, { fontSize: d.texte.surtitre }]}>{t.budget.confidentialite}</Text>
          </View>
          <Bouton libelle={t.budget.voirResultats} a11y={t.budget.voirResultatsA11y} onPress={suivant} />
        </>
      }
    >
      <EnteteQuestion
        etape={3}
        etapeA11y={t.etape(3)}
        surtitre={t.budget.etiquette}
        titre={t.budget.titre}
        aide={t.uneReponse}
      />

      <View accessibilityRole="radiogroup">
        {choix.map((c) => (
          <BoutonChoix
            key={String(c.valeur)}
            libelle={c.libelle}
            icone={iconeBudget(c.valeur)}
            selectionne={texte === '' && valeur === c.valeur}
            onPress={() => choisir(c.valeur)}
          />
        ))}
      </View>

      {saisieLibre && (
        <View style={{ marginTop: espace.s }}>
          <Text nativeID="libelle-montant" style={[styles.champLibelle, { fontSize: d.texte.corps }]}>
            {saisieLibre.libelle} ({saisieLibre.unite})
          </Text>
          <TextInput
            value={texte}
            onChangeText={saisir}
            keyboardType="decimal-pad"
            placeholder={t.budget.montantPlaceholder}
            placeholderTextColor={couleurs.texteSecondaire}
            accessibilityLabel={t.budget.montantA11y(saisieLibre.libelle, saisieLibre.unite)}
            accessibilityLabelledBy="libelle-montant"
            style={[
              styles.champ,
              { minHeight: d.px(56), fontSize: d.texte.choix },
              texte !== '' && !texteInvalide && styles.champActif,
            ]}
          />
          {texteInvalide && (
            <Message
              type="erreur"
              texte={t.budget.montantInvalide(
                saisieLibre.min.toLocaleString(t.locale),
                saisieLibre.max.toLocaleString(t.locale),
                saisieLibre.unite,
              )}
            />
          )}
        </View>
      )}

      {aEssaye && valeur === undefined && !texteInvalide && <Message type="erreur" texte={t.erreurChoix} />}
    </Page>
  );
}

const styles = StyleSheet.create({
  champLibelle: { fontFamily: polices.texteMoyen, color: couleurs.texte, marginBottom: espace.s },
  champ: {
    borderWidth: 2,
    borderColor: 'rgba(66, 168, 183, 0.55)',
    borderRadius: rayons.m,
    paddingHorizontal: espace.l,
    fontFamily: polices.texteMoyen,
    color: couleurs.texte,
  },
  champActif: { borderColor: couleurs.primaire },
  confidentialite: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: espace.s },
  confidentialiteTexte: { flexShrink: 1, fontFamily: polices.texte, color: couleurs.texteSecondaire },
});
