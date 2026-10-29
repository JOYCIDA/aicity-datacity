import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import EcranAccueil from './src/screens/EcranAccueil';
import EcranDuree from './src/screens/EcranDuree';
import EcranInterets from './src/screens/EcranInterets';
import EcranBudget from './src/screens/EcranBudget';
import EcranResultats, { Recherche } from './src/screens/EcranResultats';
import EcranFiche from './src/screens/EcranFiche';
import EcranSignalement from './src/screens/EcranSignalement';
import EtatChargement from './src/components/EtatChargement';
import { chargerQuestions, ErreurApi } from './src/api/client';
import { versQuestions } from './src/api/adaptateur';
import { couleurs } from './src/theme';
import { Reponses } from './src/types/parcours';
import { Activite } from './src/types/activite';
import { Questions } from './src/types/questions';

type Etape =
  | 'accueil'
  | 'duree'
  | 'interets'
  | 'budget'
  | 'resultats'
  | 'fiche'
  | 'signalement';

export default function App() {
  const [policesPretes] = useFonts({
    SpaceGrotesk_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
  });
  const [etape, setEtape] = useState<Etape>('accueil');
  const [reponses, setReponses] = useState<Reponses>({ interets: [] });
  const [activiteChoisie, setActiviteChoisie] = useState<Activite | null>(null);
  const [recherche, setRecherche] = useState<Recherche | null>(null);
  const [questions, setQuestions] = useState<Questions | null>(null);
  const [erreurQuestions, setErreurQuestions] = useState<string | null>(null);

  const chargerLesQuestions = useCallback(async () => {
    setErreurQuestions(null);
    try {
      setQuestions(versQuestions(await chargerQuestions()));
    } catch (e) {
      setErreurQuestions(
        e instanceof ErreurApi ? e.message : 'Les questions n’ont pas pu être chargées. Réessaie dans un instant.',
      );
    }
  }, []);

  useEffect(() => {
    chargerLesQuestions();
  }, [chargerLesQuestions]);

  if (!policesPretes) return null;

  const basculerInteret = (valeur: string) => {
    const interets = reponses.interets.includes(valeur)
      ? reponses.interets.filter((i) => i !== valeur)
      : [...reponses.interets, valeur];
    setReponses({ ...reponses, interets });
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.fond }}>
        <StatusBar style="light" />

        {etape === 'accueil' && (
          <EcranAccueil onCommencer={() => setEtape('duree')} />
        )}

        {etape !== 'accueil' && !questions && (
          <View style={{ padding: 16 }}>
            <EtatChargement
              message="Chargement des questions…"
              erreur={erreurQuestions}
              onReessayer={chargerLesQuestions}
            />
          </View>
        )}

        {etape === 'duree' && questions && (
          <EcranDuree
            choix={questions.durees}
            valeur={reponses.duree}
            onChoisir={(duree) => setReponses({ ...reponses, duree })}
            onSuivant={() => setEtape('interets')}
          />
        )}

        {etape === 'interets' && questions && (
          <EcranInterets
            choix={questions.categories}
            valeurs={reponses.interets}
            onBasculer={basculerInteret}
            onAjouter={(codes) =>
              setReponses({ ...reponses, interets: [...new Set([...reponses.interets, ...codes])] })
            }
            onRetour={() => setEtape('duree')}
            onSuivant={() => setEtape('budget')}
          />
        )}

        {etape === 'budget' && questions && (
          <EcranBudget
            choix={questions.budgets}
            saisieLibre={questions.budgetLibre}
            valeur={reponses.budget}
            onChoisir={(budget) => setReponses({ ...reponses, budget })}
            onRetour={() => setEtape('interets')}
            onSuivant={() => {
              setRecherche(null);
              setEtape('resultats');
            }}
          />
        )}

        {etape === 'resultats' && questions && (
          <EcranResultats
            questions={questions}
            reponses={reponses}
            recherche={recherche}
            onRecherche={setRecherche}
            onRetour={() => setEtape('budget')}
            onOuvrir={(activite) => {
              setActiviteChoisie(activite);
              setEtape('fiche');
            }}
          />
        )}

        {etape === 'fiche' && activiteChoisie && (
          <EcranFiche
            activite={activiteChoisie}
            onRetour={() => setEtape('resultats')}
            onSignaler={() => setEtape('signalement')}
          />
        )}

        {etape === 'signalement' && activiteChoisie && (
          <EcranSignalement
            activite={activiteChoisie}
            onRetour={() => setEtape('fiche')}
            onEnvoyer={(signalement) =>
              console.log('Signalement (non envoyé au serveur)', signalement)
            }
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}