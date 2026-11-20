import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

// Pied de page commun à toutes les pages : mention du projet et lien vers la page « Vie privée ».
export function PiedDePage() {
  return (
    <footer className="pied">
      <p className="t-legende secondaire">© {new Date().getFullYear()} AiCity · Projet DataCity, EFREI Paris</p>
      <Link to="/vie-privee" className="pied-lien t-legende">
        <ShieldCheck size={14} aria-hidden="true" />
        Données et vie privée
      </Link>
    </footer>
  );
}
