// Accès à l'API AiCity (backend/). Toutes les erreurs arrivent sous la forme
// { erreur: { code, message, details } } : on les transforme en ErreurApi.

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
const CLE_JETON = 'aicity-pro-jeton';

export type Role = 'CITOYEN' | 'ENTREPRISE' | 'ADMIN';
export type StatutCompte = 'EN_ATTENTE' | 'ACTIF' | 'REFUSE' | 'SUSPENDU';

export type Utilisateur = {
  id: string;
  email: string;
  role: Role;
  langue: 'FR' | 'EN';
  creeLe?: string;
  entreprise?: { id: string; nom: string; statut: StatutCompte; motifRefus: string | null } | null;
};

type ReponseAuth = { token: string; utilisateur: Utilisateur };

export class ErreurApi extends Error {
  constructor(
    message: string,
    readonly statut: number,
    readonly code?: string,
    // Erreurs de validation : champ concerné → message (ex. { email: 'Adresse e-mail invalide' })
    readonly champs: Record<string, string> = {},
  ) {
    super(message);
  }
}

// Le jeton est gardé dans le navigateur pour rester connecté entre deux visites (7 jours côté serveur).
export const jeton = {
  lire: () => {
    try {
      return localStorage.getItem(CLE_JETON);
    } catch {
      return null;
    }
  },
  ecrire: (valeur: string) => {
    try {
      localStorage.setItem(CLE_JETON, valeur);
    } catch {
      // Stockage indisponible (navigation privée) : la session ne durera que le temps de la page.
    }
  },
  effacer: () => {
    try {
      localStorage.removeItem(CLE_JETON);
    } catch {
      // rien à faire
    }
  },
};

// Session expirée : prévenu par l'AuthProvider, qui renvoie vers la connexion.
let surSessionExpiree: (() => void) | null = null;
export function quandSessionExpire(rappel: () => void) {
  surSessionExpiree = rappel;
}

async function requete<T>(chemin: string, options: RequestInit = {}): Promise<T> {
  const entetes = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) entetes.set('Content-Type', 'application/json');
  const valeur = jeton.lire();
  if (valeur) entetes.set('Authorization', `Bearer ${valeur}`);

  let reponse: Response;
  try {
    reponse = await fetch(`${API_URL}${chemin}`, { ...options, headers: entetes });
  } catch {
    throw new ErreurApi('Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.', 0, 'RESEAU');
  }

  if (reponse.status === 204) return undefined as T;
  const corps = await reponse.json().catch(() => null);
  if (reponse.ok) return corps as T;

  const erreur = corps?.erreur ?? {};
  if (reponse.status === 401 && valeur && surSessionExpiree) surSessionExpiree();
  const champs: Record<string, string> = {};
  if (Array.isArray(erreur.details)) {
    for (const d of erreur.details) {
      const cle = Array.isArray(d.path) ? d.path.join('.') : undefined;
      if (cle && !champs[cle]) champs[cle] = d.message;
    }
  }
  throw new ErreurApi(erreur.message ?? 'Une erreur est survenue. Réessayez dans quelques instants.', reponse.status, erreur.code, champs);
}

export const api = {
  connexion: (email: string, motDePasse: string) =>
    requete<ReponseAuth>('/auth/connexion', { method: 'POST', body: JSON.stringify({ email, motDePasse }) }),

  inscription: (donnees: {
    email: string;
    motDePasse: string;
    entreprise: { nom: string; typeActivite: string; adresse: string };
  }) =>
    requete<ReponseAuth>('/auth/inscription', {
      method: 'POST',
      body: JSON.stringify({ role: 'ENTREPRISE', langue: 'FR', ...donnees }),
    }),

  moi: () => requete<{ utilisateur: Utilisateur }>('/auth/moi').then((r) => r.utilisateur),
};
