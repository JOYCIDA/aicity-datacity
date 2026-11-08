import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../auth';
import { Alerte } from '../composants/Alerte';
import type { StatutCompte } from '../api';

// Provisoire : statistiques et dernières offres arrivent avec la page « Mes offres ».
const STATUTS: Record<StatutCompte, { type: 'info' | 'succes' | 'erreur' | 'alerte'; titre: string; texte: string }> = {
  EN_ATTENTE: {
    type: 'info',
    titre: 'Compte en cours de vérification',
    texte: 'Vous pourrez publier vos offres dès que l’administration AiCity aura validé votre établissement.',
  },
  ACTIF: { type: 'succes', titre: 'Compte actif', texte: 'Vous pouvez publier vos offres.' },
  REFUSE: { type: 'erreur', titre: 'Dossier refusé', texte: 'Consultez le motif et envoyez un nouveau justificatif.' },
  SUSPENDU: { type: 'alerte', titre: 'Compte suspendu', texte: 'Vos offres ne sont plus proposées.' },
};

export default function TableauDeBord() {
  const { utilisateur } = useAuth();
  const entreprise = utilisateur?.entreprise;
  const statut = entreprise ? STATUTS[entreprise.statut] : null;

  return (
    <div className="page">
      <header>
        <h1 className="t-affiche">Bonjour, {entreprise?.nom ?? utilisateur?.email}</h1>
        <p className="t-corps secondaire" style={{ marginTop: 'var(--e-s)' }}>
          Votre espace pour publier et suivre vos offres dans AiCity.
        </p>
      </header>
      {statut && (
        <Alerte type={statut.type} titre={statut.titre}>
          <p>{statut.texte}</p>
          {entreprise?.statut !== 'ACTIF' && (
            <p style={{ marginTop: 'var(--e-s)' }}>
              <Link to="/compte" className="lien-fleche">
                Voir mon compte
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </p>
          )}
        </Alerte>
      )}
    </div>
  );
}
