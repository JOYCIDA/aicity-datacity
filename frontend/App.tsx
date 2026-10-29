import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import EcranAccueil from './src/screens/EcranAccueil';
import EcranDuree from './src/screens/EcranDuree';
import EcranInterets from './src/screens/EcranInterets';
import EcranBudget from './src/screens/EcranBudget';
import EcranResultats, { Recherche } from './src/screens/EcranResultats';
import EcranFiche from './src/screens/EcranFiche';
import EcranSignalement from './src/screens/EcranSignalement';
import EtatChargement from './src/components/EtatChargement';
import KioskTopBar from './src/components/KioskTopBar';
import { chargerQuestions, definirLangue, ErreurApi, QuestionApi } from './src/api/client';
import { versQuestions } from './src/api/adaptateur';
import { couleurs } from './src/theme';
import { Reponses } from './src/types/parcours';
import { Activite } from './src/types/activite';
import { Langue, LangueContext, TEXTES } from './src/i18n';

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
    DMSans_700Bold,
  });
  const [etape, setEtape] = useState<Etape>('accueil');
  const [reponses, setReponses] = useState<Reponses>({ interets: [] });
  const [activiteChoisie, setActiviteChoisie] = useState<Activite | null>(null);
  const [recherche, setRecherche] = useState<Recherche | null>(null);
  const [langue, setLangue] = useState<Langue>('FR');
  // Questions brutes du backend (FR et EN) ; on n'affiche que la langue choisie.
  const [questionsApi, setQuestionsApi] = useState<QuestionApi[] | null>(null);
  const [erreurQuestions, setErreurQuestions] = useState<unknown>(null);
  const questions = useMemo(
    () => (questionsApi ? versQuestions(questionsApi, langue) : null),
    [questionsApi, langue],
  );

  const chargerLesQuestions = useCallback(async () => {
    setErreurQuestions(null);
    try {
      const api = await chargerQuestions();
      versQuestions(api, 'FR'); // vérifie que les 3 questions sont bien là
      setQuestionsApi(api);
    } catch (e) {
      setErreurQuestions(e);
    }
  }, []);

  useEffect(() => {
    chargerLesQuestions();
  }, [chargerLesQuestions]);

  if (!policesPretes) return null;

  const t = TEXTES[langue];

  const changerLangue = (l: Langue) => {
    definirLangue(l);
    setLangue(l);
    // Les résultats affichés sont dans l'ancienne langue : on les recharge.
    setRecherche(null);
    if (etape === 'fiche') setEtape('resultats');
  };

  // Écran précédent pour le bouton Retour de la barre du haut (aucun sur l'accueil).
  const PRECEDENT: Partial<Record<Etape, Etape>> = {
    duree: 'accueil',
    interets: 'duree',
    budget: 'interets',
    resultats: 'budget',
    fiche: 'resultats',
    signalement: 'fiche',
  };
  const precedent = PRECEDENT[etape];

  const basculerInteret = (valeur: string) => {
    const interets = reponses.interets.includes(valeur)
      ? reponses.interets.filter((i) => i !== valeur)
      : [...reponses.interets, valeur];
    setReponses({ ...reponses, interets });
  };

  return (
    <LangueContext.Provider value={langue}>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.fond }}>
          <StatusBar style="light" />
          <KioskTopBar
            showBack={precedent !== undefined}
            onBack={() => precedent && setEtape(precedent)}
            lang={langue}
            onLangChange={changerLangue}
          />

          {etape === 'accueil' && (
            <EcranAccueil
              categories={questions?.categories ?? null}
              onRaccourci={(categorie) => {
                setReponses({ ...reponses, interets: [categorie] });
                setEtape('duree');
              }}
              onCommencer={() => setEtape('duree')}
            />
          )}

          {etape !== 'accueil' && !questions && (
            <View style={{ padding: 16 }}>
              <EtatChargement
                message={t.chargementQuestions}
                erreur={
                  erreurQuestions === null
                    ? null
                    : erreurQuestions instanceof ErreurApi
                      ? erreurQuestions.message
                      : t.erreurs.generique
                }
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
              onSuivant={() => setEtape('budget')}
            />
          )}

          {etape === 'budget' && questions && (
            <EcranBudget
              choix={questions.budgets}
              saisieLibre={questions.budgetLibre}
              valeur={reponses.budget}
              onChoisir={(budget) => setReponses({ ...reponses, budget })}
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
              onChangerDuree={(duree) => {
                setReponses({ ...reponses, duree });
                setRecherche(null);
              }}
              onOuvrir={(activite) => {
                setActiviteChoisie(activite);
                setEtape('fiche');
              }}
            />
          )}

          {etape === 'fiche' && activiteChoisie && (
            <EcranFiche
              activite={activiteChoisie}
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
    </LangueContext.Provider>
  );
}