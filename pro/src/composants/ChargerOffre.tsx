import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api, ErreurApi, type Offre } from '../api';
import { Alerte } from './Alerte';

// Charge l'offre de l'adresse (/offres/:id…) et gère chargement, erreur et offre introuvable.
export function ChargerOffre({ children }: { children: (offre: Offre, remplacer: (o: Offre) => void) => ReactNode }) {
  const { id } = useParams();
  const [offre, setOffre] = useState<Offre | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(() => {
    if (!id) return;
    setErreur(null);
    api
      .offre(id)
      .then(setOffre)
      .catch((err) =>
        setErreur(
          err instanceof ErreurApi && (err.statut === 404 || err.statut === 403)
            ? 'Cette offre n’existe pas ou ne vous appartient pas.'
            : err instanceof ErreurApi
              ? err.message
              : 'Impossible de charger l’offre.',
        ),
      );
  }, [id]);

  useEffect(charger, [charger]);

  if (erreur) {
    return (
      <div className="page">
        <Link to="/offres" className="lien-discret lien-retour">
          <ArrowLeft size={16} aria-hidden="true" />
          Mes offres
        </Link>
        <Alerte type="erreur">{erreur}</Alerte>
        <button type="button" className="bouton bouton-secondaire" style={{ alignSelf: 'flex-start' }} onClick={charger}>
          Réessayer
        </button>
      </div>
    );
  }
  if (!offre) {
    return (
      <div className="page" role="status">
        <p className="t-corps secondaire">Chargement de l’offre…</p>
      </div>
    );
  }
  return <>{children(offre, setOffre)}</>;
}
