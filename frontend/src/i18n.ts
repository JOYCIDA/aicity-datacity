import { createContext, useContext } from 'react';

export type Langue = 'FR' | 'EN';
export const LANGUES: Langue[] = ['FR', 'EN'];

const FR = {
  locale: 'fr-FR',
  nomLangue: 'Français',
  accueil: {
    accroche: 'Trouve une activité près de toi en moins de 2 minutes.',
    commencer: 'Commencer',
    mention: 'Aucun compte. Aucune inscription. Session effacée à la fin.',
    choixLangue: 'Langue',
    queCherchesTu: 'Que cherches-tu ?',
    raccourciA11y: (categorie: string) => `${categorie} : commencer avec cette envie`,
  },
  retour: 'Retour',
  suivant: 'Suivant ›',
  suivantA11y: 'Suivant',
  reessayer: 'Réessayer',
  etape: (n: number) => `Étape ${n} sur 3`,
  question: (n: number) => `QUESTION ${n} SUR 3`,
  uneReponse: 'Une seule réponse.',
  erreurChoix: 'Choisis une réponse pour continuer.',
  chargementQuestions: 'Chargement des questions…',
  duree: { titre: 'Combien de temps as-tu devant toi ?' },
  interets: {
    titre: "Qu'est-ce qui t'attire le plus en ce moment ?",
    aide: 'Choisis une ou plusieurs réponses.',
    erreur: 'Choisis au moins une réponse pour continuer.',
    autreLibelle: 'Autre… dis-moi avec tes mots',
    autrePlaceholder: 'Ex. : voir une expo, courir au parc',
    autreA11y: 'Autre : décris ce que tu as envie de faire',
    valider: 'OK',
    validerA11y: 'Valider ma phrase',
    phraseNonEnregistree: "Ta phrase n'est jamais enregistrée.",
    nonCompris: "Je n'ai pas reconnu d'activité dans ta phrase. Essaie d'autres mots ou choisis ci-dessus.",
    compris: (libelles: string) => `J'ai compris : ${libelles}. C'est coché ci-dessus.`,
  },
  budget: {
    etiquette: 'QUESTION 3 SUR 3 — DERNIÈRE !',
    titre: 'Quel est ton budget pour cette sortie ?',
    montantPlaceholder: 'Ex. : 15',
    montantA11y: (libelle: string, unite: string) => `${libelle} en ${unite}`,
    montantInvalide: (min: string, max: string, unite: string) =>
      `Entre un montant entre ${min} et ${max} ${unite}, avec au plus 2 chiffres après la virgule.`,
    confidentialite: 'Tes données ne sont pas enregistrées.',
    voirResultats: 'Voir les résultats ›',
    voirResultatsA11y: 'Voir les résultats',
  },
  resultats: {
    chargement: 'Je cherche des activités près de toi…',
    aucune: 'Aucune activité trouvée',
    trouvees: (n: number) => `${n} activité${n > 1 ? 's' : ''} trouvée${n > 1 ? 's' : ''} près de toi`,
    elargie: "Peu d'activités tout près : nous avons élargi la zone de recherche.",
    aucunTemps: 'Aucune activité ne tient dans ce temps-là. Avec un peu plus de temps, tu auras plus de choix.',
    aucunChoix: "Aucune activité ne correspond à tes choix. Modifie ton budget ou tes centres d'intérêt.",
    plusDeTemps: (duree: string) => `Chercher avec plus de temps (${duree})`,
    jusqua: (prix: string) => `Jusqu'à ${prix}`,
  },
  position: {
    refusee: "Tu n'as pas autorisé l'accès à ta position : nous cherchons autour du centre de Paris.",
    horsParis: 'Tu sembles être hors de Paris : nous cherchons autour du centre de Paris.',
    introuvable: "Ta position n'a pas pu être trouvée : nous cherchons autour du centre de Paris.",
  },
  fiche: {
    pourquoi: 'Pourquoi cette proposition ?',
    lieu: 'Lieu',
    horaire: 'Horaire',
    prix: 'Prix',
    distance: 'Distance',
    description: 'À propos',
    photo: (titre: string) => `Photo : ${titre}`,
    yAller: "M'y rendre",
    yAllerA11y: "M'y rendre : ouvrir l'itinéraire à pied",
    partager: 'Partager',
    partageMessage: (titre: string, lieu: string, horaires: string) =>
      `${titre} — ${lieu} (${horaires}). Trouvé avec AiCity.`,
    voirSur: (source: string) => `Voir l'offre sur ${source}`,
    signaler: 'Signaler une information erronée',
  },
  aPied: (minutes: number) => `${minutes} min à pied`,
  sourceMaj: (source: string, date: string) => `Source : ${source} · Mis à jour le ${date}`,
  a: 'à',
  gratuit: 'Gratuit',
  prixInconnu: 'Prix non communiqué',
  horaires: {
    aPartirDu: (debut: string) => `À partir du ${debut}`,
    enCours: (fin: string) => `En cours, jusqu'au ${fin}`,
    duAu: (debut: string, fin: string) => `Du ${debut} au ${fin}`,
    jourHeure: (jour: string, heure: string) => `${jour} à ${heure}`,
  },
  sources: {
    ENTREPRISE: 'Partenaire AiCity',
    OPENAGENDA: 'OpenAgenda',
    DATA_GOUV: 'data.gouv.fr',
    PARIS_OPEN_DATA: 'Paris Open Data',
  } as Record<string, string>,
  erreurs: {
    reseau: 'Impossible de joindre le serveur. Vérifie ta connexion.',
    generique: 'Une erreur est survenue. Réessaie dans un instant.',
  },
};

export type Textes = typeof FR;

const EN: Textes = {
  locale: 'en-GB',
  nomLangue: 'English',
  accueil: {
    accroche: 'Find an activity near you in less than 2 minutes.',
    commencer: 'Start',
    mention: 'No account. No sign-up. Session erased at the end.',
    choixLangue: 'Language',
    queCherchesTu: 'What are you looking for?',
    raccourciA11y: (categorie) => `${categorie}: start with this interest`,
  },
  retour: 'Back',
  suivant: 'Next ›',
  suivantA11y: 'Next',
  reessayer: 'Try again',
  etape: (n) => `Step ${n} of 3`,
  question: (n) => `QUESTION ${n} OF 3`,
  uneReponse: 'One answer only.',
  erreurChoix: 'Choose an answer to continue.',
  chargementQuestions: 'Loading questions…',
  duree: { titre: 'How much time do you have?' },
  interets: {
    titre: 'What appeals to you most right now?',
    aide: 'Choose one or more answers.',
    erreur: 'Choose at least one answer to continue.',
    autreLibelle: 'Other… tell me in your own words',
    autrePlaceholder: 'E.g. see an exhibition, run in the park',
    autreA11y: 'Other: describe what you feel like doing',
    valider: 'OK',
    validerA11y: 'Submit my sentence',
    phraseNonEnregistree: 'Your sentence is never stored.',
    nonCompris: "I didn't recognise an activity in your sentence. Try other words or choose above.",
    compris: (libelles) => `Got it: ${libelles}. It's ticked above.`,
  },
  budget: {
    etiquette: 'QUESTION 3 OF 3 — LAST ONE!',
    titre: "What's your budget for this outing?",
    montantPlaceholder: 'E.g. 15',
    montantA11y: (libelle, unite) => `${libelle} in ${unite}`,
    montantInvalide: (min, max, unite) =>
      `Enter an amount between ${min} and ${max} ${unite}, with at most 2 decimal places.`,
    confidentialite: 'Your data is not stored.',
    voirResultats: 'See results ›',
    voirResultatsA11y: 'See results',
  },
  resultats: {
    chargement: 'Looking for activities near you…',
    aucune: 'No activity found',
    trouvees: (n) => `${n} ${n > 1 ? 'activities' : 'activity'} found near you`,
    elargie: 'Few activities close by: we widened the search area.',
    aucunTemps: 'No activity fits in that time. With a little more time, you will have more choice.',
    aucunChoix: 'No activity matches your answers. Change your budget or your interests.',
    plusDeTemps: (duree) => `Search with more time (${duree})`,
    jusqua: (prix) => `Up to ${prix}`,
  },
  position: {
    refusee: "You didn't allow access to your location: we are searching around central Paris.",
    horsParis: 'You seem to be outside Paris: we are searching around central Paris.',
    introuvable: 'Your location could not be found: we are searching around central Paris.',
  },
  fiche: {
    pourquoi: 'Why this suggestion?',
    lieu: 'Place',
    horaire: 'Opening times',
    prix: 'Price',
    distance: 'Distance',
    description: 'About',
    photo: (titre) => `Photo: ${titre}`,
    yAller: 'Take me there',
    yAllerA11y: 'Take me there: open walking directions',
    partager: 'Share',
    partageMessage: (titre, lieu, horaires) => `${titre} — ${lieu} (${horaires}). Found with AiCity.`,
    voirSur: (source) => `See the offer on ${source}`,
    signaler: 'Report incorrect information',
  },
  aPied: (minutes) => `${minutes} min walk`,
  sourceMaj: (source, date) => `Source: ${source} · Updated on ${date}`,
  a: 'at',
  gratuit: 'Free',
  prixInconnu: 'Price not given',
  horaires: {
    aPartirDu: (debut) => `From ${debut}`,
    enCours: (fin) => `Ongoing, until ${fin}`,
    duAu: (debut, fin) => `From ${debut} to ${fin}`,
    jourHeure: (jour, heure) => `${jour} at ${heure}`,
  },
  sources: {
    ENTREPRISE: 'AiCity partner',
    OPENAGENDA: 'OpenAgenda',
    DATA_GOUV: 'data.gouv.fr',
    PARIS_OPEN_DATA: 'Paris Open Data',
  },
  erreurs: {
    reseau: 'Cannot reach the server. Check your connection.',
    generique: 'Something went wrong. Try again in a moment.',
  },
};

export const TEXTES: Record<Langue, Textes> = { FR, EN };

export const LangueContext = createContext<Langue>('FR');

export function useLangue(): Langue {
  return useContext(LangueContext);
}

export function useTextes(): Textes {
  return TEXTES[useContext(LangueContext)];
}
