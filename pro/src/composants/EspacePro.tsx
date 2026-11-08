import { NavLink, Outlet } from 'react-router-dom';
import { CircleUserRound, LayoutDashboard, LogOut, Tag, type LucideIcon } from 'lucide-react';
import { useAuth } from '../auth';
import { Logo } from './Logo';

// Seules les pages déjà construites figurent dans le menu : jamais de lien vers une page vide.
const MENU: { chemin: string; libelle: string; icone: LucideIcon }[] = [
  { chemin: '/', libelle: 'Tableau de bord', icone: LayoutDashboard },
  { chemin: '/offres', libelle: 'Mes offres', icone: Tag },
  { chemin: '/compte', libelle: 'Mon compte', icone: CircleUserRound },
];

// Initiales affichées dans la pastille de l'entreprise (« Musée Exemple » → « ME »).
function initiales(nom: string) {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0]!.toUpperCase())
    .join('');
}

export function EspacePro() {
  const { utilisateur, fermerSession } = useAuth();
  const nom = utilisateur?.entreprise?.nom ?? utilisateur?.email ?? '';

  return (
    <div className="espace">
      <a href="#contenu" className="lien-evitement">
        Aller au contenu
      </a>
      <aside className="barre">
        <div className="barre-logo">
          <Logo />
        </div>
        <nav aria-label="Navigation principale">
          <ul className="menu">
            {MENU.map(({ chemin, libelle, icone: Icone }) => (
              <li key={chemin}>
                <NavLink to={chemin} end className="menu-lien">
                  <Icone size={20} aria-hidden="true" />
                  {libelle}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="barre-compte">
          <span className="pastille" aria-hidden="true">
            {initiales(nom)}
          </span>
          <div className="barre-compte-texte">
            <p className="t-corps-fort">{nom}</p>
            <p className="t-legende secondaire">{utilisateur?.email}</p>
          </div>
          <button type="button" className="bouton-icone" onClick={fermerSession} aria-label="Se déconnecter" title="Se déconnecter">
            <LogOut size={20} aria-hidden="true" />
          </button>
        </div>
      </aside>
      <main id="contenu" className="espace-contenu" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
