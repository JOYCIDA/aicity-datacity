import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Logo } from '../composants/Logo';

export default function Introuvable() {
  return (
    <div className="page-simple">
      <header className="page-simple-entete">
        <Logo />
      </header>
      <main className="page-simple-contenu">
        <FileQuestion size={40} aria-hidden="true" className="page-simple-icone" />
        <h1 className="t-titre">Page introuvable</h1>
        <p className="t-corps secondaire">Cette page n’existe pas ou a été déplacée.</p>
        <div className="page-simple-actions">
          <Link to="/" className="bouton bouton-primaire">
            Retour au tableau de bord
          </Link>
        </div>
      </main>
    </div>
  );
}
