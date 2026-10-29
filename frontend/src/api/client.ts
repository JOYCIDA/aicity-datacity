import { API_URL } from '../config';
import { Langue, TEXTES } from '../i18n';

// Formes renvoyées par le backend (backend/src/services/recommandation.service.ts, utils/dto.ts).
export type SourceOffre = 'ENTREPRISE' | 'OPENAGENDA' | 'DATA_GOUV' | 'PARIS_OPEN_DATA';

export type OffreApi = {
  id: string;
  titre: string;
  description: string | null;
  lieu: string;
  adresse: string | null;
  latitude: number;
  longitude: number;
  debut: string;
  fin: string | null;
  horaires: string | null;
  dureeMinutes: number;
  prix: number | null;
  gratuit: boolean;
  photoUrl: string | null;
  // Pas encore renvoyés par le backend (demandés à Elfried) : facultatifs en attendant.
  photoCredit?: string | null;
  photoAlt?: string | null;
  source: SourceOffre;
  sourceUrl: string | null;
  creeLe: string;
  majLe: string;
  categorie: { code: string; libelleFr: string; libelleEn: string; picto: string | null };
  entreprise: { id: string; nom: string } | null;
};

export type ResultatApi = {
  rang: number;
  score: number;
  scoreMax: number;
  explication: string;
  distanceM: number;
  trajetMinutes: number;
  offre: OffreApi;
};

export type ReponseRecommandations = {
  rechercheId: string | null;
  elargie: boolean;
  rayonM: number;
  resultats: ResultatApi[];
};

// backend/src/config/questions.ts
export type Libelle = { FR: string; EN: string };

export type QuestionApi = {
  id: 'tempsLibreMinutes' | 'budgetMax' | 'categories';
  libelle: Libelle;
  choixMultiple: boolean;
  choix: { valeur: number | string | null; libelle: Libelle }[];
  saisieLibre?: { min: number; max: number; pas: number; unite: string; libelle: Libelle };
};

export type Criteres = {
  latitude: number;
  longitude: number;
  tempsLibreMinutes: number;
  budgetMax: number | null;
  categories: string[];
  rayonM?: number;
};

export class ErreurApi extends Error {
  constructor(public statut: number, public code: string, message: string) {
    super(message);
  }
}

// Le jeton reste en mémoire seulement : il disparaît quand l'appli se ferme.
let jeton: string | null = null;
let langue: Langue = 'FR';

// Langue des réponses du backend (explications) et des messages d'erreur.
export function definirLangue(l: Langue) {
  langue = l;
}

async function requete<T>(chemin: string, init: RequestInit = {}): Promise<T> {
  let reponse: Response;
  try {
    reponse = await fetch(`${API_URL}${chemin}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ErreurApi(0, 'RESEAU', TEXTES[langue].erreurs.reseau);
  }

  const corps = await reponse.json().catch(() => null);
  if (!reponse.ok) {
    const erreur = corps?.erreur;
    // Les messages du backend sont en français : en anglais, on affiche un message générique.
    const message = langue === 'FR' && erreur?.message ? erreur.message : TEXTES[langue].erreurs.generique;
    throw new ErreurApi(reponse.status, erreur?.code ?? 'INCONNUE', message);
  }
  return corps as T;
}

export async function ouvrirSessionAnonyme(): Promise<void> {
  jeton = null;
  const session = await requete<{ jeton: string; expireLe: string }>('/citoyen/sessions/anonyme', {
    method: 'POST',
    body: JSON.stringify({ langue }),
  });
  jeton = session.jeton;
}

// Ouvre une session si besoin, et la rouvre une fois si le jeton a expiré (401).
async function avecSession<T>(appel: () => Promise<T>): Promise<T> {
  if (!jeton) await ouvrirSessionAnonyme();
  try {
    return await appel();
  } catch (e) {
    if (e instanceof ErreurApi && e.statut === 401) {
      await ouvrirSessionAnonyme();
      return appel();
    }
    throw e;
  }
}

export async function chargerQuestions(): Promise<QuestionApi[]> {
  const { questions } = await requete<{ questions: QuestionApi[] }>('/citoyen/questions');
  return questions;
}

// Le texte n'est jamais enregistré par le backend : seule l'interprétation revient.
export type Interpretation = { tempsLibreMinutes?: number; budgetMax?: number; categories: string[] };

export async function interpreter(texte: string): Promise<Interpretation> {
  const { interpretation } = await requete<{ interpretation: Interpretation }>('/citoyen/interpretations', {
    method: 'POST',
    body: JSON.stringify({ texte }),
  });
  return interpretation;
}

export function recommander(criteres: Criteres): Promise<ReponseRecommandations> {
  return avecSession(() =>
    requete<ReponseRecommandations>('/citoyen/recommandations', {
      method: 'POST',
      body: JSON.stringify({ ...criteres, langue }),
    }),
  );
}
