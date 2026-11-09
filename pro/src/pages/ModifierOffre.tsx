import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../api';
import { Alerte } from '../composants/Alerte';
import { ChargerOffre } from '../composants/ChargerOffre';
import { differences, FormulaireOffre } from '../composants/FormulaireOffre';

export default function ModifierOffre() {
  const navigate = useNavigate();

  return (
    <ChargerOffre>
      {(offre) => {
        const detail = `/offres/${offre.id}`;
        return (
          <div className="page">
            <Link to={detail} className="lien-discret lien-retour">
              <ArrowLeft size={16} aria-hidden="true" />
              Retour à l’offre
            </Link>
            <header>
              <h1 className="t-affiche">Modifier l’offre</h1>
              <p className="t-corps secondaire" style={{ marginTop: 'var(--e-s)' }}>
                {offre.titre}
              </p>
            </header>

            {offre.statut === 'EXPIREE' ? (
              <Alerte type="info" titre="Offre expirée">
                Une offre terminée ne peut plus être modifiée. Créez une nouvelle offre pour une prochaine date.
              </Alerte>
            ) : (
              <>
                {offre.statut === 'REFUSE' && (
                  <Alerte type="erreur" titre="Motif du refus">
                    {offre.motifRefus && <p className="motif">{offre.motifRefus}</p>}
                    <p>Une fois corrigée, l’offre repart en vérification.</p>
                  </Alerte>
                )}
                {(offre.statut === 'VALIDE' || offre.statut === 'EN_PAUSE') && (
                  <Alerte type="info" titre="Ce qui relance une vérification">
                    Modifier le lieu, l’adresse, la position, le prix ou les dates renvoie l’offre en vérification : elle ne
                    sera plus proposée jusqu’à sa validation. Le titre, la description, les horaires, la durée et la photo se
                    modifient sans attendre.
                  </Alerte>
                )}
                <FormulaireOffre
                  offre={offre}
                  libelleEnvoi={offre.statut === 'REFUSE' ? 'Corriger et renvoyer' : 'Enregistrer les modifications'}
                  retour={detail}
                  envoyer={async (donnees) => {
                    const changements = differences(offre, donnees);
                    if (Object.keys(changements).length === 0) {
                      throw new Error('Aucune modification à enregistrer.');
                    }
                    const mise = await api.modifierOffre(offre.id, changements);
                    navigate(detail, {
                      state: {
                        annonce:
                          mise.statut === 'EN_ATTENTE' && offre.statut !== 'EN_ATTENTE'
                            ? 'Modifications enregistrées. L’offre repart en vérification.'
                            : 'Modifications enregistrées.',
                      },
                    });
                  }}
                />
              </>
            )}
          </div>
        );
      }}
    </ChargerOffre>
  );
}
