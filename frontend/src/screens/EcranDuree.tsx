import { useState } from 'react';
import { View } from 'react-native';
import BoutonChoix from '../components/BoutonChoix';
import { iconeDuree } from '../components/Icones';
import { Bouton, EnteteQuestion, Message, Page } from '../design';
import { useTextes } from '../i18n';
import { Duree } from '../types/parcours';
import { Choix } from '../types/questions';

type Props = {
  choix: Choix<Duree>[];
  valeur?: Duree;
  onChoisir: (d: Duree) => void;
  onSuivant: () => void;
};

export default function EcranDuree({ choix, valeur, onChoisir, onSuivant }: Props) {
  const t = useTextes();
  const [aEssaye, setAEssaye] = useState(false);

  const suivant = () => {
    if (valeur === undefined) {
      setAEssaye(true);
      return;
    }
    onSuivant();
  };

  return (
    <Page pied={<Bouton libelle={t.suivant} a11y={t.suivantA11y} onPress={suivant} />}>
      <EnteteQuestion
        etape={1}
        etapeA11y={t.etape(1)}
        surtitre={t.question(1)}
        titre={t.duree.titre}
        aide={t.uneReponse}
      />
      <View accessibilityRole="radiogroup">
        {choix.map((c) => (
          <BoutonChoix
            key={c.valeur}
            libelle={c.libelle}
            icone={iconeDuree(c.valeur)}
            selectionne={valeur === c.valeur}
            onPress={() => onChoisir(c.valeur)}
          />
        ))}
      </View>
      {aEssaye && valeur === undefined && <Message type="erreur" texte={t.erreurChoix} />}
    </Page>
  );
}
