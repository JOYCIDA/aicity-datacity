import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { Alerte } from '../composants/Alerte';
import { FormulaireOffre } from '../composants/FormulaireOffre';

export default function NouvelleOffre() {
  const { utilisateur } = useAuth();
  const navigate = useNavigate();

  if (utilisateur?.entreprise?.statut !== 'ACTIF') {
    return (
      <div className="page">
        <h1 className="t-affiche">Nouvelle offre</h1>
        <Alerte type="info" titre="Votre compte n’est pas encore actif">
          <p>Vous pourrez publier des offres dès que l’administration AiCity aura validé votre établissement.</p>
          <p style={{ marginTop: 'var(--e-s)' }}>
            <Link to="/compte">Voir l’état de mon dossier</Link>
          </p>
        </Alerte>
      </div>
    );
  }

  return (
    <div className="page">
      <Link to="/offres" className="lien-discret lien-retour">
        <ArrowLeft size={16} aria-hidden="true" />
        Mes offres
      </Link>
      <header>
        <h1 className="t-affiche">Nouvelle offre</h1>
        <p className="t-corps secondaire" style={{ marginTop: 'var(--e-s)' }}>
          Votre offre sera vérifiée par AiCity avant d’être proposée aux habitants.
        </p>
      </header>
      <FormulaireOffre
        lieuParDefaut={utilisateur.entreprise.nom}
        libelleEnvoi="Envoyer pour vérification"
        retour="/offres"
        envoyer={async (donnees) => {
          const offre = await api.creerOffre(donnees);
          navigate('/offres?statut=EN_ATTENTE', {
            state: { annonce: `« ${offre.titre} » a été envoyée à AiCity. Elle sera visible après vérification.` },
          });
        }}
      />
    </div>
  );
}
