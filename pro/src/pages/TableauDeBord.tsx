import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import { api, ErreurApi, type Offre, type StatutCompte, type Statistiques } from '../api';
import { useAuth } from '../auth';
import { Alerte } from '../composants/Alerte';
import { GraphiqueJours, type PointJour } from '../composants/GraphiqueJours';
import { formaterDate, LIBELLES_STATUT_OFFRE } from '../format';

const PERIODES = [7, 30, 90];

const STATUTS: Record<StatutCompte, { type: 'info' | 'succes' | 'erreur' | 'alerte'; titre: string; texte: string } | null> = {
  EN_ATTENTE: {
    type: 'info',
    titre: 'Compte en cours de vérification',
    texte: 'Vous pourrez publier vos offres dès que l’administration AiCity aura validé votre établissement.',
  },
  ACTIF: null,
  REFUSE: { type: 'erreur', titre: 'Dossier refusé', texte: 'Consultez le motif et envoyez un nouveau justificatif.' },
  SUSPENDU: { type: 'alerte', titre: 'Compte suspendu', texte: 'Vos offres ne sont plus proposées.' },
};

// Le backend ne renvoie que les jours avec de l'activité : on complète les autres par zéro,
// sinon la courbe relierait deux jours actifs en sautant les jours calmes.
function joursComplets(stats: Statistiques): PointJour[] {
  const parJour = new Map(stats.parJour.map((j) => [j.jour, j.vues]));
  const points: PointJour[] = [];
  const debut = new Date(`${stats.periode.du}T12:00:00Z`);
  for (let i = 0; i < stats.periode.jours; i++) {
    const jour = new Date(debut.getTime() + i * 86_400_000).toISOString().slice(0, 10);
    points.push({ jour, valeur: parJour.get(jour) ?? 0 });
  }
  return points;
}

function Tuile({ valeur, libelle, detail }: { valeur: number; libelle: string; detail?: string }) {
  return (
    <div className="carte tuile-stat">
      <p className="t-corps secondaire">{libelle}</p>
      <p className="tuile-valeur chiffres">{valeur.toLocaleString('fr-FR')}</p>
      {detail && <p className="t-legende secondaire">{detail}</p>}
    </div>
  );
}

export default function TableauDeBord() {
  const { utilisateur } = useAuth();
  const entreprise = utilisateur?.entreprise;
  const statut = entreprise ? STATUTS[entreprise.statut] : null;
  const [jours, setJours] = useState(30);
  const [stats, setStats] = useState<Statistiques | null>(null);
  const [dernieres, setDernieres] = useState<Offre[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(() => {
    setErreur(null);
    setStats(null);
    Promise.all([api.statistiques(jours), api.offres({ page: 1, taille: 5 })])
      .then(([s, o]) => {
        setStats(s);
        setDernieres(o.elements);
      })
      .catch((err) => setErreur(err instanceof ErreurApi ? err.message : 'Impossible de charger vos statistiques.'));
  }, [jours]);

  useEffect(charger, [charger]);

  const nombre = (s: string) => stats?.parStatut.find((p) => p.statut === s)?.offres ?? 0;
  const refusees = nombre('REFUSE');
  const enAttente = nombre('EN_ATTENTE');

  return (
    <div className="page">
      <header className="page-entete">
        <div>
          <h1 className="t-affiche">Bonjour, {entreprise?.nom ?? utilisateur?.email}</h1>
          <p className="t-corps secondaire">Votre activité dans AiCity sur les {jours}&nbsp;derniers jours.</p>
        </div>
        {entreprise?.statut === 'ACTIF' && (
          <Link to="/offres/nouvelle" className="bouton bouton-primaire">
            <Plus size={18} aria-hidden="true" />
            Nouvelle offre
          </Link>
        )}
      </header>

      {statut && (
        <Alerte type={statut.type} titre={statut.titre}>
          <p>{statut.texte}</p>
          <p style={{ marginTop: 'var(--e-s)' }}>
            <Link to="/compte" className="lien-fleche">
              Voir mon compte
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </p>
        </Alerte>
      )}

      {(refusees > 0 || enAttente > 0) && (
        <Alerte type={refusees > 0 ? 'alerte' : 'info'} titre="À suivre">
          <ul className="liste-a-faire">
            {refusees > 0 && (
              <li>
                {refusees}&nbsp;offre{refusees > 1 ? 's' : ''} refusée{refusees > 1 ? 's' : ''} à corriger.{' '}
                <Link to="/offres?statut=REFUSE">Voir et corriger</Link>
              </li>
            )}
            {enAttente > 0 && (
              <li>
                {enAttente}&nbsp;offre{enAttente > 1 ? 's' : ''} en cours de vérification par AiCity.
              </li>
            )}
          </ul>
        </Alerte>
      )}

      <div className="barre-section">
        <h2 className="t-sous-titre">Statistiques</h2>
        <div className="segments" role="group" aria-label="Période">
          {PERIODES.map((p) => (
            <button key={p} type="button" className="segment" aria-pressed={jours === p} onClick={() => setJours(p)}>
              {p}&nbsp;jours
            </button>
          ))}
        </div>
      </div>

      {erreur ? (
        <div>
          <Alerte type="erreur">{erreur}</Alerte>
          <button type="button" className="bouton bouton-secondaire" style={{ marginTop: 'var(--e-m)' }} onClick={charger}>
            Réessayer
          </button>
        </div>
      ) : !stats ? (
        <p className="t-corps secondaire" role="status">
          Chargement des statistiques…
        </p>
      ) : (
        <>
          <div className="tuiles-stats">
            <Tuile valeur={stats.totaux.offres} libelle="Offres" detail={`dont ${nombre('VALIDE')} publiée${nombre('VALIDE') > 1 ? 's' : ''}`} />
            <Tuile valeur={stats.totaux.vues} libelle="Vues" detail="fiches ouvertes par des habitants" />
            <Tuile valeur={stats.totaux.recommandations} libelle="Recommandations" detail="fois proposées par AiCity" />
            <Tuile valeur={stats.totaux.favoris} libelle="Favoris" detail="ajouts aux favoris" />
          </div>

          <div className="carte bloc">
            <GraphiqueJours titre="Vues par jour" unite="vues" points={joursComplets(stats)} />
          </div>
          <p className="t-legende secondaire">
            Statistiques anonymes et agrégées : aucune information sur les habitants n’est transmise aux entreprises.
          </p>
        </>
      )}

      {dernieres && dernieres.length > 0 && (
        <section className="carte" aria-labelledby="titre-dernieres">
          <div className="barre-section bloc-entete">
            <h2 id="titre-dernieres" className="t-sous-titre">
              Dernières offres
            </h2>
            <Link to="/offres" className="lien-fleche">
              Toutes mes offres
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <ul className="liste-offres">
            {dernieres.map((o) => (
              <li key={o.id}>
                <Link to={`/offres/${o.id}`} className="lien-offre t-corps-fort">
                  {o.titre}
                </Link>
                <span className="t-legende secondaire chiffres">{formaterDate(o.debut)}</span>
                <span className={`statut statut-offre-${o.statut.toLowerCase()}`}>{LIBELLES_STATUT_OFFRE[o.statut]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
