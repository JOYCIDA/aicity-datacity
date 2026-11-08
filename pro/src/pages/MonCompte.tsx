import { useCallback, useEffect, useId, useRef, useState, type DragEvent } from 'react';
import { Check, FileText, UploadCloud, X } from 'lucide-react';
import { api, ErreurApi, type Entreprise, type StatutCompte } from '../api';
import { useAuth } from '../auth';
import { Alerte } from '../composants/Alerte';

const TYPES_ACCEPTES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const TAILLE_MAX = 5 * 1024 * 1024;

export const LIBELLES_STATUT: Record<StatutCompte, string> = {
  EN_ATTENTE: 'En vérification',
  ACTIF: 'Actif',
  REFUSE: 'Refusé',
  SUSPENDU: 'Suspendu',
};

function formaterDate(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
}

function formaterTaille(octets: number) {
  return octets < 1024 * 1024 ? `${Math.max(1, Math.round(octets / 1024))} Ko` : `${(octets / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`;
}

type EtatEtape = 'fait' | 'en-cours' | 'erreur' | 'a-venir';

function etapes(e: Entreprise): { libelle: string; etat: EtatEtape }[] {
  const validation: EtatEtape =
    e.statut === 'ACTIF' || e.statut === 'SUSPENDU'
      ? 'fait'
      : e.statut === 'REFUSE'
        ? 'erreur'
        : e.justificatifFourni
          ? 'en-cours'
          : 'a-venir';
  return [
    { libelle: 'Compte créé', etat: 'fait' },
    { libelle: 'Justificatif', etat: e.justificatifFourni ? 'fait' : 'en-cours' },
    { libelle: e.statut === 'REFUSE' ? 'Dossier refusé' : 'Validation par AiCity', etat: validation },
    {
      libelle: e.statut === 'SUSPENDU' ? 'Compte suspendu' : 'Compte actif',
      etat: e.statut === 'ACTIF' ? 'fait' : e.statut === 'SUSPENDU' ? 'erreur' : 'a-venir',
    },
  ];
}

const ETAT_LECTEUR: Record<EtatEtape, string> = {
  fait: 'terminée',
  'en-cours': 'en cours',
  erreur: 'bloquée',
  'a-venir': 'à venir',
};

function Bandeau({ entreprise }: { entreprise: Entreprise }) {
  switch (entreprise.statut) {
    case 'ACTIF':
      return <Alerte type="succes" titre="Votre compte est actif">Vous pouvez publier vos offres.</Alerte>;
    case 'REFUSE':
      return (
        <Alerte type="erreur" titre="Votre dossier a été refusé">
          {entreprise.motifRefus && <p className="motif">{entreprise.motifRefus}</p>}
          <p>Envoyez un nouveau justificatif : la vérification reprendra automatiquement.</p>
        </Alerte>
      );
    case 'SUSPENDU':
      return (
        <Alerte type="alerte" titre="Votre compte est suspendu">
          {entreprise.motifRefus && <p className="motif">{entreprise.motifRefus}</p>}
          <p>Vos offres ne sont plus proposées. Contactez l’administration AiCity.</p>
        </Alerte>
      );
    default:
      return entreprise.justificatifFourni ? (
        <Alerte type="info" titre="Dossier en cours de vérification">
          L’administration AiCity vérifie votre établissement. Vous pourrez publier vos offres dès la validation.
        </Alerte>
      ) : (
        <Alerte type="alerte" titre="Envoyez votre justificatif">
          La vérification de votre établissement commencera dès sa réception.
        </Alerte>
      );
  }
}

function EnvoiJustificatif({ entreprise, onEnvoye }: { entreprise: Entreprise; onEnvoye: (e: Entreprise) => void }) {
  const idChamp = useId();
  const champ = useRef<HTMLInputElement>(null);
  const [fichier, setFichier] = useState<File | null>(null);
  const [survol, setSurvol] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const choisir = (f: File | undefined) => {
    setErreur(null);
    if (!f) return;
    if (!TYPES_ACCEPTES.includes(f.type)) {
      setErreur('Format non accepté. Envoyez un PDF, une image JPEG, PNG ou WebP.');
      return;
    }
    if (f.size > TAILLE_MAX) {
      setErreur(`Fichier trop lourd (${formaterTaille(f.size)}). 5 Mo au maximum.`);
      return;
    }
    setFichier(f);
  };

  const deposer = (e: DragEvent) => {
    e.preventDefault();
    setSurvol(false);
    choisir(e.dataTransfer.files[0]);
  };

  const envoyer = async () => {
    if (!fichier) return;
    setEnCours(true);
    setErreur(null);
    try {
      const mise = await api.envoyerJustificatif(fichier);
      setFichier(null);
      if (champ.current) champ.current.value = '';
      onEnvoye(mise);
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'L’envoi a échoué. Réessayez.');
    } finally {
      setEnCours(false);
    }
  };

  const remplacement = entreprise.justificatifFourni;

  return (
    <section className="carte bloc" aria-labelledby={`${idChamp}-titre`}>
      <div>
        <h2 id={`${idChamp}-titre`} className="t-sous-titre">
          {remplacement ? 'Remplacer le justificatif' : 'Envoyer un justificatif'}
        </h2>
        <p className="t-legende secondaire">Extrait Kbis, avis de situation SIRENE ou statuts d’association.</p>
      </div>

      <div
        className={`depot${survol ? ' depot-survol' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setSurvol(true);
        }}
        onDragLeave={() => setSurvol(false)}
        onDrop={deposer}
      >
        <UploadCloud size={28} aria-hidden="true" className="depot-icone" />
        <p className="t-corps-fort">Glissez votre fichier ici</p>
        <p className="t-legende secondaire">PDF, JPEG, PNG ou WebP · 5&nbsp;Mo au maximum</p>
        <input
          ref={champ}
          id={idChamp}
          type="file"
          accept={TYPES_ACCEPTES.join(',')}
          className="lecteur-ecran"
          onChange={(e) => choisir(e.target.files?.[0])}
        />
        <label htmlFor={idChamp} className="bouton bouton-secondaire">
          Choisir un fichier
        </label>
        {remplacement && <p className="t-legende secondaire">Le nouveau fichier remplacera le précédent.</p>}
      </div>

      {fichier && (
        <div className="fichier">
          <FileText size={20} aria-hidden="true" />
          <div className="fichier-texte">
            <p className="t-corps-fort">{fichier.name}</p>
            <p className="t-legende secondaire chiffres">{formaterTaille(fichier.size)}</p>
          </div>
          <button
            type="button"
            className="bouton-icone"
            onClick={() => {
              setFichier(null);
              if (champ.current) champ.current.value = '';
            }}
            aria-label={`Retirer ${fichier.name}`}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
      )}

      {erreur && <Alerte type="erreur">{erreur}</Alerte>}

      <button
        type="button"
        className="bouton bouton-primaire bouton-large"
        onClick={envoyer}
        disabled={!fichier || enCours}
        aria-busy={enCours}
      >
        {enCours ? 'Envoi en cours…' : 'Envoyer le justificatif'}
      </button>
    </section>
  );
}

export default function MonCompte() {
  const { rafraichir } = useAuth();
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  const charger = useCallback(() => {
    setErreur(null);
    api
      .profil()
      .then(setEntreprise)
      .catch((err) => setErreur(err instanceof ErreurApi ? err.message : 'Impossible de charger votre compte.'));
  }, []);

  useEffect(charger, [charger]);

  if (erreur) {
    return (
      <div className="page">
        <h1 className="t-affiche">Mon compte</h1>
        <Alerte type="erreur">{erreur}</Alerte>
        <button type="button" className="bouton bouton-secondaire" onClick={charger}>
          Réessayer
        </button>
      </div>
    );
  }
  if (!entreprise) {
    return (
      <div className="page" role="status">
        <h1 className="t-affiche">Mon compte</h1>
        <p className="t-corps secondaire">Chargement…</p>
      </div>
    );
  }

  const infos: [string, string][] = [
    ['Nom', entreprise.nom],
    ['Type d’activité', entreprise.typeActivite],
    ['Adresse', entreprise.adresse],
    ['E-mail', entreprise.email],
    ['Compte créé le', formaterDate(entreprise.creeLe)],
    ['Justificatif', entreprise.justificatifFourni ? 'Reçu' : 'Pas encore envoyé'],
  ];

  return (
    <div className="page">
      <header className="page-entete">
        <div>
          <h1 className="t-affiche">Mon compte</h1>
          <p className="t-corps secondaire">Les informations de votre établissement et l’état de votre dossier.</p>
        </div>
        <span className={`statut statut-${entreprise.statut.toLowerCase()}`}>
          <span className="lecteur-ecran">Statut du compte : </span>
          {LIBELLES_STATUT[entreprise.statut]}
        </span>
      </header>

      {succes && (
        <Alerte type="succes" titre="Justificatif reçu">
          L’administration AiCity va vérifier votre dossier.
        </Alerte>
      )}
      <Bandeau entreprise={entreprise} />

      <section className="carte bloc" aria-labelledby="titre-progression">
        <h2 id="titre-progression" className="t-sous-titre">
          Avancement du dossier
        </h2>
        <ol className="progression">
          {etapes(entreprise).map((etape, i) => (
            <li
              key={etape.libelle}
              className={`progression-etape etape-${etape.etat}`}
              aria-current={etape.etat === 'en-cours' ? 'step' : undefined}
            >
              <span className="progression-pastille" aria-hidden="true">
                {etape.etat === 'fait' ? <Check size={16} strokeWidth={3} /> : etape.etat === 'erreur' ? <X size={16} strokeWidth={3} /> : i + 1}
              </span>
              <span className="t-corps">
                {etape.libelle}
                <span className="lecteur-ecran"> : étape {ETAT_LECTEUR[etape.etat]}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="grille-deux">
        <section className="carte bloc" aria-labelledby="titre-infos">
          <h2 id="titre-infos" className="t-sous-titre">
            Votre établissement
          </h2>
          <dl className="lignes">
            {infos.map(([libelle, valeur]) => (
              <div key={libelle} className="ligne">
                <dt className="secondaire">{libelle}</dt>
                <dd className="t-corps-fort chiffres">{valeur}</dd>
              </div>
            ))}
          </dl>
        </section>

        <EnvoiJustificatif
          entreprise={entreprise}
          onEnvoye={(mise) => {
            setEntreprise(mise);
            setSucces(true);
            rafraichir().catch(() => {});
          }}
        />
      </div>
    </div>
  );
}
