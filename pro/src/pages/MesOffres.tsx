import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pause, Play, Plus } from 'lucide-react';
import { api, ErreurApi, type Offre, type Page, type StatutOffre } from '../api';
import { useAuth } from '../auth';
import { Alerte } from '../composants/Alerte';
import { ICONES_CATEGORIE } from '../categories';
import { formaterDate, formaterPrix, LIBELLES_STATUT_OFFRE } from '../format';

const TAILLE = 20;

// Onglets de filtre : la valeur est gardée dans l'adresse (?statut=…), pour le bouton Retour et les liens.
const FILTRES: { statut?: StatutOffre; libelle: string }[] = [
  { libelle: 'Toutes' },
  { statut: 'EN_ATTENTE', libelle: 'En attente' },
  { statut: 'VALIDE', libelle: 'Publiées' },
  { statut: 'REFUSE', libelle: 'Refusées' },
  { statut: 'EN_PAUSE', libelle: 'En pause' },
  { statut: 'EXPIREE', libelle: 'Expirées' },
];

function Vignette({ offre }: { offre: Offre }) {
  const Icone = ICONES_CATEGORIE[offre.categorie.code];
  return offre.photoUrl ? (
    <img src={offre.photoUrl} alt="" className="vignette" loading="lazy" />
  ) : (
    <span className="vignette vignette-vide" aria-hidden="true">
      {Icone && <Icone size={20} />}
    </span>
  );
}

export default function MesOffres() {
  const { utilisateur } = useAuth();
  const [parametres, setParametres] = useSearchParams();
  const statut = (parametres.get('statut') as StatutOffre | null) ?? undefined;
  const numero = Math.max(1, Number(parametres.get('page')) || 1);
  const [resultat, setResultat] = useState<Page<Offre> | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  // Message laissé par la page « Nouvelle offre » après un envoi réussi.
  const annonce = (useLocation().state as { annonce?: string } | null)?.annonce;
  const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(
    annonce ? { type: 'succes', texte: annonce } : null,
  );
  const [enCours, setEnCours] = useState<string | null>(null); // id de l'offre en cours de changement

  const charger = useCallback(() => {
    setErreur(null);
    setResultat(null);
    api
      .offres({ statut, page: numero, taille: TAILLE })
      .then(setResultat)
      .catch((err) => setErreur(err instanceof ErreurApi ? err.message : 'Impossible de charger vos offres.'));
  }, [statut, numero]);

  useEffect(charger, [charger]);

  const filtrer = (s?: StatutOffre) => {
    setMessage(null);
    setParametres(s ? { statut: s } : {});
  };

  const allerPage = (p: number) => {
    const suivants = new URLSearchParams(parametres);
    suivants.set('page', String(p));
    setParametres(suivants);
  };

  const basculer = async (offre: Offre) => {
    const cible = offre.statut === 'VALIDE' ? 'EN_PAUSE' : 'VALIDE';
    setEnCours(offre.id);
    setMessage(null);
    try {
      const mise = await api.changerStatutOffre(offre.id, cible);
      setResultat((r) => r && { ...r, elements: r.elements.map((o) => (o.id === mise.id ? mise : o)) });
      setMessage({
        type: 'succes',
        texte: cible === 'EN_PAUSE' ? `« ${offre.titre} » est en pause : elle n’est plus proposée.` : `« ${offre.titre} » est de nouveau proposée.`,
      });
    } catch (err) {
      setMessage({ type: 'erreur', texte: err instanceof ErreurApi ? err.message : 'Le changement a échoué. Réessayez.' });
    } finally {
      setEnCours(null);
    }
  };

  const total = resultat?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / TAILLE));
  const premier = total === 0 ? 0 : (numero - 1) * TAILLE + 1;
  const dernier = Math.min(numero * TAILLE, total);
  const compteActif = utilisateur?.entreprise?.statut === 'ACTIF';

  return (
    <div className="page">
      <header className="page-entete">
        <div>
          <h1 className="t-affiche">Mes offres</h1>
          <p className="t-corps secondaire chiffres">
            {resultat
              ? `${total} offre${total > 1 ? 's' : ''}${statut ? ` · ${LIBELLES_STATUT_OFFRE[statut]}` : ' au total'}`
              : ' '}
          </p>
        </div>
        {compteActif && (
          <Link to="/offres/nouvelle" className="bouton bouton-primaire">
            <Plus size={18} aria-hidden="true" />
            Nouvelle offre
          </Link>
        )}
      </header>

      {!compteActif && (
        <Alerte type="info">Vous pourrez publier des offres dès que votre compte aura été validé par AiCity.</Alerte>
      )}

      <nav aria-label="Filtrer par statut">
        <ul className="filtres">
          {FILTRES.map((f) => (
            <li key={f.libelle}>
              <button
                type="button"
                className="filtre"
                aria-pressed={statut === f.statut}
                onClick={() => filtrer(f.statut)}
              >
                {f.libelle}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {message && <Alerte type={message.type}>{message.texte}</Alerte>}

      {erreur ? (
        <div className="bloc-vide">
          <Alerte type="erreur">{erreur}</Alerte>
          <button type="button" className="bouton bouton-secondaire" onClick={charger}>
            Réessayer
          </button>
        </div>
      ) : !resultat ? (
        <p className="t-corps secondaire" role="status">
          Chargement de vos offres…
        </p>
      ) : resultat.elements.length === 0 ? (
        <div className="carte bloc-vide">
          <p className="t-sous-titre">{statut ? 'Aucune offre dans cette catégorie' : 'Vous n’avez pas encore d’offre'}</p>
          <p className="t-corps secondaire">
            {statut ? 'Choisissez un autre filtre pour voir vos autres offres.' : 'Vos offres apparaîtront ici dès leur création.'}
          </p>
        </div>
      ) : (
        <div className="carte tableau-cadre">
          <table className="tableau">
            <caption className="lecteur-ecran">
              Vos offres{statut ? ` (filtre : ${LIBELLES_STATUT_OFFRE[statut]})` : ''}, page {numero} sur {pages}
            </caption>
            <thead>
              <tr>
                <th scope="col">Offre</th>
                <th scope="col">Catégorie</th>
                <th scope="col">Début</th>
                <th scope="col">Prix</th>
                <th scope="col">Statut</th>
                <th scope="col">
                  <span className="lecteur-ecran">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {resultat.elements.map((offre) => (
                <tr key={offre.id} className={offre.statut === 'REFUSE' ? 'ligne-refusee' : undefined}>
                  <td data-libelle="Offre">
                    <div className="cellule-offre">
                      <Vignette offre={offre} />
                      <div>
                        <p className="t-corps-fort">{offre.titre}</p>
                        <p className="t-legende secondaire">{offre.lieu}</p>
                        {offre.statut === 'REFUSE' && offre.motifRefus && (
                          <p className="t-legende motif-refus">
                            <span className="lecteur-ecran">Motif du refus : </span>
                            {offre.motifRefus}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td data-libelle="Catégorie">{offre.categorie.libelleFr}</td>
                  <td data-libelle="Début" className="chiffres">
                    {formaterDate(offre.debut)}
                  </td>
                  <td data-libelle="Prix" className="chiffres">
                    {formaterPrix(offre.prix, offre.gratuit)}
                  </td>
                  <td data-libelle="Statut">
                    <span className={`statut statut-offre-${offre.statut.toLowerCase()}`}>{LIBELLES_STATUT_OFFRE[offre.statut]}</span>
                  </td>
                  <td className="cellule-actions">
                    {(offre.statut === 'VALIDE' || offre.statut === 'EN_PAUSE') && compteActif && (
                      <button
                        type="button"
                        className="bouton bouton-secondaire bouton-petit"
                        onClick={() => basculer(offre)}
                        disabled={enCours === offre.id}
                        aria-label={`${offre.statut === 'VALIDE' ? 'Mettre en pause' : 'Réactiver'} « ${offre.titre} »`}
                      >
                        {offre.statut === 'VALIDE' ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                        {offre.statut === 'VALIDE' ? 'Mettre en pause' : 'Réactiver'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {resultat && total > TAILLE && (
        <nav className="pagination" aria-label="Pages">
          <p className="t-legende secondaire chiffres">
            {premier}–{dernier} sur {total}
          </p>
          <div className="pagination-boutons">
            <button
              type="button"
              className="bouton-icone"
              onClick={() => allerPage(numero - 1)}
              disabled={numero <= 1}
              aria-label="Page précédente"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <span className="t-corps chiffres" aria-current="page">
              Page {numero} sur {pages}
            </span>
            <button
              type="button"
              className="bouton-icone"
              onClick={() => allerPage(numero + 1)}
              disabled={numero >= pages}
              aria-label="Page suivante"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
