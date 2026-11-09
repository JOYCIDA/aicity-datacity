import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Pause, Pencil, Play } from 'lucide-react';
import { api, ErreurApi, type Offre } from '../api';
import { useAuth } from '../auth';
import { Alerte } from '../composants/Alerte';
import { ChargerOffre } from '../composants/ChargerOffre';
import { CartePosition } from '../composants/ChoixLieu';
import { ICONES_CATEGORIE } from '../categories';
import { formaterDateHeure, formaterPrix, LIBELLES_STATUT_OFFRE } from '../format';

function formaterDuree(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const reste = minutes % 60;
  return `${Math.floor(minutes / 60)} h${reste ? ` ${String(reste).padStart(2, '0')}` : ''}`;
}

function Contenu({ offre, remplacer }: { offre: Offre; remplacer: (o: Offre) => void }) {
  const { utilisateur } = useAuth();
  const annonce = (useLocation().state as { annonce?: string } | null)?.annonce;
  const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(
    annonce ? { type: 'succes', texte: annonce } : null,
  );
  const [enCours, setEnCours] = useState(false);
  const compteActif = utilisateur?.entreprise?.statut === 'ACTIF';
  const modifiable = compteActif && offre.statut !== 'EXPIREE';
  const Icone = ICONES_CATEGORIE[offre.categorie.code];

  const basculer = async () => {
    const cible = offre.statut === 'VALIDE' ? 'EN_PAUSE' : 'VALIDE';
    setEnCours(true);
    setMessage(null);
    try {
      remplacer(await api.changerStatutOffre(offre.id, cible));
      setMessage({ type: 'succes', texte: cible === 'EN_PAUSE' ? 'L’offre est en pause : elle n’est plus proposée.' : 'L’offre est de nouveau proposée.' });
    } catch (err) {
      setMessage({ type: 'erreur', texte: err instanceof ErreurApi ? err.message : 'Le changement a échoué. Réessayez.' });
    } finally {
      setEnCours(false);
    }
  };

  const infos: [string, string][] = [
    ['Catégorie', offre.categorie.libelleFr],
    ['Début', formaterDateHeure(offre.debut)],
    ...(offre.fin ? ([['Fin', formaterDateHeure(offre.fin)]] as [string, string][]) : []),
    ...(offre.horaires ? ([['Horaires', offre.horaires]] as [string, string][]) : []),
    ['Durée de visite', formaterDuree(offre.dureeMinutes)],
    ['Tarif', formaterPrix(offre.prix, offre.gratuit)],
    ['Créée le', formaterDateHeure(offre.creeLe)],
    ['Modifiée le', formaterDateHeure(offre.majLe)],
  ];

  return (
    <div className="page">
      <Link to="/offres" className="lien-discret lien-retour">
        <ArrowLeft size={16} aria-hidden="true" />
        Mes offres
      </Link>
      <header className="page-entete">
        <div className="titre-statut">
          <h1 className="t-affiche">{offre.titre}</h1>
          <span className={`statut statut-offre-${offre.statut.toLowerCase()}`}>
            <span className="lecteur-ecran">Statut : </span>
            {LIBELLES_STATUT_OFFRE[offre.statut]}
          </span>
        </div>
        <div className="actions-entete">
          {compteActif && (offre.statut === 'VALIDE' || offre.statut === 'EN_PAUSE') && (
            <button type="button" className="bouton bouton-secondaire" onClick={basculer} disabled={enCours} aria-busy={enCours}>
              {offre.statut === 'VALIDE' ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
              {offre.statut === 'VALIDE' ? 'Mettre en pause' : 'Réactiver'}
            </button>
          )}
          {modifiable && (
            <Link to={`/offres/${offre.id}/modifier`} className={`bouton ${offre.statut === 'REFUSE' ? 'bouton-primaire' : 'bouton-secondaire'}`}>
              <Pencil size={18} aria-hidden="true" />
              {offre.statut === 'REFUSE' ? 'Corriger et renvoyer' : 'Modifier'}
            </Link>
          )}
        </div>
      </header>

      {message && <Alerte type={message.type}>{message.texte}</Alerte>}
      {offre.statut === 'REFUSE' && (
        <Alerte type="erreur" titre="Offre refusée par AiCity">
          {offre.motifRefus && <p className="motif">{offre.motifRefus}</p>}
          <p>Corrigez l’offre : elle repartira en vérification.</p>
        </Alerte>
      )}
      {offre.statut === 'EN_ATTENTE' && (
        <Alerte type="info">AiCity vérifie cette offre. Elle sera proposée aux habitants dès sa validation.</Alerte>
      )}
      {offre.statut === 'EXPIREE' && <Alerte type="info">Cette offre est terminée : elle n’est plus proposée et ne peut plus être modifiée.</Alerte>}

      <div className="detail-grille">
        <div className="detail-principal">
          <figure className="carte detail-photo">
            {offre.photoUrl ? (
              <img src={offre.photoUrl} alt={offre.photoAlt ?? ''} />
            ) : (
              <div className="detail-photo-vide">
                {Icone && <Icone size={40} aria-hidden="true" />}
                <p className="t-corps secondaire">Pas de photo : une photo rend l’offre plus visible.</p>
              </div>
            )}
            {offre.photoCredit && <figcaption className="t-legende secondaire">{offre.photoCredit}</figcaption>}
          </figure>

          <section className="carte bloc" aria-labelledby="titre-texte">
            <h2 id="titre-texte" className="t-sous-titre">
              Description
            </h2>
            <p className="t-corps texte-long">{offre.description ?? <span className="secondaire">Pas de description.</span>}</p>
            {(offre.titreEn || offre.descriptionEn || offre.lieuEn) && (
              <div lang="en" className="version-anglaise">
                <p className="t-legende secondaire" lang="fr">
                  Version anglaise
                </p>
                {offre.titreEn && <p className="t-corps-fort">{offre.titreEn}</p>}
                {offre.lieuEn && <p className="t-corps secondaire">{offre.lieuEn}</p>}
                {offre.descriptionEn && <p className="t-corps texte-long">{offre.descriptionEn}</p>}
              </div>
            )}
          </section>

          <section className="carte bloc" aria-labelledby="titre-lieu">
            <h2 id="titre-lieu" className="t-sous-titre">
              Lieu
            </h2>
            <dl className="lignes">
              <div className="ligne">
                <dt className="secondaire">Nom du lieu</dt>
                <dd className="t-corps-fort">{offre.lieu}</dd>
              </div>
              {offre.adresse && (
                <div className="ligne">
                  <dt className="secondaire">Adresse</dt>
                  <dd className="t-corps-fort">{offre.adresse}</dd>
                </div>
              )}
            </dl>
            <CartePosition
              position={{ latitude: offre.latitude, longitude: offre.longitude }}
              libelle={`Carte : position de l’offre, ${offre.lieu}`}
            />
          </section>
        </div>

        <aside className="detail-cote">
          <section className="carte bloc" aria-labelledby="titre-infos">
            <h2 id="titre-infos" className="t-sous-titre">
              Informations
            </h2>
            <dl className="lignes lignes-etroites">
              {infos.map(([libelle, valeur]) => (
                <div key={libelle} className="ligne">
                  <dt className="secondaire">{libelle}</dt>
                  <dd className="t-corps-fort chiffres">{valeur}</dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default function DetailOffre() {
  return <ChargerOffre>{(offre, remplacer) => <Contenu offre={offre} remplacer={remplacer} />}</ChargerOffre>;
}
