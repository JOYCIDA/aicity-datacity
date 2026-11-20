import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, type LucideIcon } from 'lucide-react';
import { Logo } from './Logo';

type Atout = { icone: LucideIcon; titre: string; texte: string };

// Écrans de connexion et d'inscription : colonne de marque à gauche, formulaire à droite.
export function MiseEnPageAuth({
  accroche,
  sousAccroche,
  atouts,
  children,
}: {
  accroche: string;
  sousAccroche: string;
  atouts: Atout[];
  children: ReactNode;
}) {
  return (
    <div className="auth">
      <aside className="auth-marque">
        <Logo surNuit />
        <div>
          <p className="t-titre">{accroche}</p>
          <p className="t-corps secondaire" style={{ marginTop: 'var(--e-s)' }}>
            {sousAccroche}
          </p>
        </div>
        <ul className="auth-atouts">
          {atouts.map(({ icone: Icone, titre, texte }) => (
            <li key={titre}>
              <Icone size={20} aria-hidden="true" />
              <div>
                <p className="t-corps-fort">{titre}</p>
                <p className="t-legende secondaire">{texte}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="auth-pied t-legende secondaire">Projet DataCity · EFREI Paris</p>
      </aside>
      <main className="auth-principal">
        <div className="auth-colonne">
          {children}
          <p className="auth-vie-privee t-legende">
            <Link to="/vie-privee" className="pied-lien">
              <ShieldCheck size={14} aria-hidden="true" />
              Données et vie privée
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
