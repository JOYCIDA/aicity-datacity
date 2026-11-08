import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, jeton, quandSessionExpire, type Utilisateur } from './api';

type EtatAuth = {
  utilisateur: Utilisateur | null;
  chargement: boolean; // vrai tant qu'on vérifie le jeton enregistré
  sessionExpiree: boolean;
  ouvrirSession: (token: string) => Promise<Utilisateur>;
  fermerSession: () => void;
};

const AuthContexte = createContext<EtatAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [chargement, setChargement] = useState(() => jeton.lire() !== null);
  const [sessionExpiree, setSessionExpiree] = useState(false);

  const fermerSession = useCallback(() => {
    jeton.effacer();
    setUtilisateur(null);
  }, []);

  // Le profil complet (nom et statut de l'entreprise) vient de /auth/moi.
  const ouvrirSession = useCallback(async (token: string) => {
    jeton.ecrire(token);
    const moi = await api.moi();
    setUtilisateur(moi);
    setSessionExpiree(false);
    return moi;
  }, []);

  useEffect(() => {
    quandSessionExpire(() => {
      jeton.effacer();
      setUtilisateur(null);
      setSessionExpiree(true);
    });
    const enregistre = jeton.lire();
    if (!enregistre) return;
    api
      .moi()
      .then(setUtilisateur)
      .catch(() => jeton.effacer())
      .finally(() => setChargement(false));
  }, []);

  const valeur = useMemo(
    () => ({ utilisateur, chargement, sessionExpiree, ouvrirSession, fermerSession }),
    [utilisateur, chargement, sessionExpiree, ouvrirSession, fermerSession],
  );
  return <AuthContexte.Provider value={valeur}>{children}</AuthContexte.Provider>;
}

export function useAuth() {
  const contexte = useContext(AuthContexte);
  if (!contexte) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return contexte;
}
