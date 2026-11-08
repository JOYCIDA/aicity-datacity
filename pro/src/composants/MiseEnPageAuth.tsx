import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
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
        <div className="auth-colonne">{children}</div>
      </main>
    </div>
  );
}
