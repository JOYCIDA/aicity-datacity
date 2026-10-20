import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import EcranDuree from './src/screens/EcranDuree';
import { couleurs } from './src/theme';
import { Reponses } from './src/types/parcours';

export default function App() {
  const [policesPretes] = useFonts({
    SpaceGrotesk_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
  });
  const [reponses, setReponses] = useState<Reponses>({ interets: [] });

  if (!policesPretes) return null;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.fond }}>
        <StatusBar style="light" />
        <EcranDuree
          valeur={reponses.duree}
          onChoisir={(duree) => setReponses({ ...reponses, duree })}
          onSuivant={() => console.log('Prochaine étape : intérêts', reponses)}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}