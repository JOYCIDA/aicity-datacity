import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import EcranAccueil from './src/screens/EcranAccueil';
import EcranDuree from './src/screens/EcranDuree';
import EcranInterets from './src/screens/EcranInterets';
import EcranBudget from './src/screens/EcranBudget';
import EcranResultats from './src/screens/EcranResultats';
import EcranFiche from './src/screens/EcranFiche';
import EcranSignalement from './src/screens/EcranSignalement';
import { couleurs } from './src/theme';
import { Reponses } from './src/types/parcours';
import { Activite } from './src/types/activite';

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

        {etape === 'duree' && (
          <EcranDuree
            valeur={reponses.duree}
            onChoisir={(duree) => setReponses({ ...reponses, duree })}
            onSuivant={() => setEtape('interets')}
          />
        )}

        {etape === 'interets' && (
          <EcranInterets
            valeurs={reponses.interets}
            onBasculer={basculerInteret}
            onRetour={() => setEtape('duree')}
            onSuivant={() => setEtape('budget')}
          />
        )}

        {etape === 'budget' && (
          <EcranBudget
            valeur={reponses.budget}
            onChoisir={(budget) => setReponses({ ...reponses, budget })}
            onRetour={() => setEtape('interets')}
            onSuivant={() => setEtape('resultats')}
          />
        )}

        {etape === 'resultats' && (
          <EcranResultats
            reponses={reponses}
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
