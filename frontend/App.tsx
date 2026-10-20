import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import EcranDuree from './src/screens/EcranDuree';
import EcranInterets from './src/screens/EcranInterets';
import EcranBudget from './src/screens/EcranBudget';
import EcranResultats from './src/screens/EcranResultats';
import { couleurs } from './src/theme';
import { Reponses } from './src/types/parcours';

type Etape = 'duree' | 'interets' | 'budget' | 'resultats';

export default function App() {
  const [policesPretes] = useFonts({
    SpaceGrotesk_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
  });
  const [etape, setEtape] = useState<Etape>('duree');
  const [reponses, setReponses] = useState<Reponses>({ interets: [] });

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
          <EcranResultats reponses={reponses} onRetour={() => setEtape('budget')} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}