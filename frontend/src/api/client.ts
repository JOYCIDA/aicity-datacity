import { API_URL } from '../config';

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
    throw new ErreurApi(0, 'RESEAU', 'Impossible de joindre le serveur. Vérifie ta connexion.');
  }

  const corps = await reponse.json().catch(() => null);
  if (!reponse.ok) {
    const erreur = corps?.erreur;
    throw new ErreurApi(
      reponse.status,
      erreur?.code ?? 'INCONNUE',
      erreur?.message ?? 'Une erreur est survenue. Réessaie dans un instant.',
    );
  }
  return corps as T;
}

export async function ouvrirSessionAnonyme(): Promise<void> {
  jeton = null;
  const session = await requete<{ jeton: string; expireLe: string }>('/citoyen/sessions/anonyme', {
    method: 'POST',
    body: JSON.stringify({ langue: 'FR' }),
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

export function recommander(criteres: Criteres): Promise<ReponseRecommandations> {
  return avecSession(() =>
    requete<ReponseRecommandations>('/citoyen/recommandations', {
      method: 'POST',
      body: JSON.stringify({ ...criteres, langue: 'FR' }),
    }),
  );
}
