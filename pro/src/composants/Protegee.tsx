import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { useAuth } from '../auth';
import { Logo } from './Logo';

// Pages réservées : sans session, on part vers la connexion en gardant la page demandée.
export function Protegee({ children }: { children: ReactNode }) {
  const { utilisateur, chargement } = useAuth();
  const { pathname, search } = useLocation();

  if (chargement) {
    return (
      <p className="lecteur-ecran" role="status">
        Chargement…
      </p>
    );
  }
  if (!utilisateur) {
    return <Navigate to={`/connexion?redirect=${encodeURIComponent(pathname + search)}`} replace />;
  }
  if (utilisateur.role !== 'ENTREPRISE') return <EspaceReserve />;
  return children;
}

function EspaceReserve() {
  return (
    <div className="page-simple">
      <header className="page-simple-entete">
        <Logo />
      </header>
      <main className="page-simple-contenu">
        <ShieldX size={40} aria-hidden="true" className="page-simple-icone" />
        <h1 className="t-titre">Espace réservé aux entreprises</h1>
        <p className="t-corps secondaire">
          Cette section est accessible uniquement aux entreprises partenaires d’AiCity. Si vous êtes une entreprise,
          connectez-vous avec votre compte entreprise ou créez-en un.
        </p>
        <div className="page-simple-actions">
          <Link to="/connexion" className="bouton bouton-primaire">
            Se connecter
          </Link>
          <Link to="/inscription" className="bouton bouton-secondaire">
            Créer un compte
          </Link>
        </div>
      </main>
    </div>
  );
}
