import { LogOut } from 'lucide-react';
import { useAuth } from '../auth';
import { Alerte } from '../composants/Alerte';
import { Logo } from '../composants/Logo';
import type { StatutCompte } from '../api';

// Provisoire : le vrai tableau de bord (barre latérale, statistiques, offres) arrive à l'étape suivante.
const STATUTS: Record<StatutCompte, { type: 'info' | 'succes' | 'erreur' | 'alerte'; titre: string; texte: string }> = {
  EN_ATTENTE: {
    type: 'info',
    titre: 'Compte en cours de vérification',
    texte: 'L’administration AiCity vérifie votre établissement. Vous pourrez publier vos offres dès la validation.',
  },
  ACTIF: { type: 'succes', titre: 'Compte actif', texte: 'Vous pouvez publier vos offres.' },
  REFUSE: { type: 'erreur', titre: 'Dossier refusé', texte: 'Consultez le motif et envoyez un nouveau justificatif.' },
  SUSPENDU: { type: 'alerte', titre: 'Compte suspendu', texte: 'Contactez l’administration AiCity.' },
};

export default function TableauDeBord() {
  const { utilisateur, fermerSession } = useAuth();
  const entreprise = utilisateur?.entreprise;
  const statut = entreprise ? STATUTS[entreprise.statut] : null;

  return (
    <div className="page-simple">
      <header className="page-simple-entete">
        <Logo />
        <button type="button" className="bouton bouton-secondaire" onClick={fermerSession}>
          <LogOut size={18} aria-hidden="true" />
          Se déconnecter
        </button>
      </header>
      <main className="page-simple-contenu" style={{ textAlign: 'left', alignItems: 'stretch' }}>
        <h1 className="t-affiche">Bonjour, {entreprise?.nom ?? utilisateur?.email}</h1>
        {statut && (
          <Alerte type={statut.type} titre={statut.titre}>
            {entreprise?.motifRefus ?? statut.texte}
          </Alerte>
        )}
      </main>
    </div>
  );
}
