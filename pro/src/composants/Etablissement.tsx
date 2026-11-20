import { useRef, useState, type FormEvent } from 'react';
import { Pencil } from 'lucide-react';
import { api, ErreurApi, type Entreprise } from '../api';
import { formaterDateHeure } from '../format';
import { Alerte } from './Alerte';
import { Champ } from './Champ';

export const TYPES_ACTIVITE = ['Musée', 'Restaurant', 'Café', 'Salle de sport', 'Commerce', 'Association', 'Théâtre', 'Cinéma', 'Parc / Jardin'];

type Valeurs = { nom: string; typeActivite: string; adresse: string };
type Erreurs = Partial<Record<keyof Valeurs, string>>;
const ORDRE: (keyof Valeurs)[] = ['nom', 'typeActivite', 'adresse'];

// Mêmes règles que le backend (backend/src/schemas/entreprise.schema.ts).
function verifier(v: Valeurs): Erreurs {
  const e: Erreurs = {};
  const nom = v.nom.trim().length;
  if (nom < 2 || nom > 120) e.nom = 'Entre 2 et 120 caractères.';
  const type = v.typeActivite.trim().length;
  if (type < 2 || type > 120) e.typeActivite = 'Choisissez ou saisissez votre type d’activité (2 à 120 caractères).';
  const adresse = v.adresse.trim().length;
  if (adresse < 5 || adresse > 250) e.adresse = 'Entre 5 et 250 caractères.';
  return e;
}

// « Votre établissement » : lecture, puis modification sur place du nom, de l'activité et de l'adresse.
// L'e-mail du compte n'est pas modifiable ici (pas de route côté serveur).
export function Etablissement({ entreprise, onModifie }: { entreprise: Entreprise; onModifie: (e: Entreprise) => void }) {
  const formulaire = useRef<HTMLFormElement>(null);
  const boutonModifier = useRef<HTMLButtonElement>(null);
  const [edition, setEdition] = useState(false);
  const [v, setV] = useState<Valeurs>({ nom: '', typeActivite: '', adresse: '' });
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [probleme, setProbleme] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [enCours, setEnCours] = useState(false);

  const ouvrir = () => {
    setV({ nom: entreprise.nom, typeActivite: entreprise.typeActivite, adresse: entreprise.adresse });
    setErreurs({});
    setProbleme(null);
    setSucces(false);
    setEdition(true);
    requestAnimationFrame(() => formulaire.current?.querySelector<HTMLElement>('[name="nom"]')?.focus());
  };

  const fermer = () => {
    setEdition(false);
    requestAnimationFrame(() => boutonModifier.current?.focus());
  };

  const changer = (cle: keyof Valeurs, valeur: string) => {
    setV((ancien) => ({ ...ancien, [cle]: valeur }));
    if (erreurs[cle]) setErreurs((ancien) => ({ ...ancien, [cle]: undefined }));
  };

  const allerAuPremier = (e: Erreurs) => {
    const premier = ORDRE.find((c) => e[c]);
    if (premier) requestAnimationFrame(() => formulaire.current?.querySelector<HTMLElement>(`[name="${premier}"]`)?.focus());
  };

  const enregistrer = async (ev: FormEvent) => {
    ev.preventDefault();
    setProbleme(null);
    const e = verifier(v);
    setErreurs(e);
    if (Object.keys(e).length > 0) {
      allerAuPremier(e);
      return;
    }
    // On n'envoie que ce qui a changé.
    const changements: Partial<Valeurs> = {};
    for (const cle of ORDRE) {
      if (v[cle].trim() !== entreprise[cle]) changements[cle] = v[cle].trim();
    }
    if (Object.keys(changements).length === 0) {
      fermer();
      return;
    }
    setEnCours(true);
    try {
      const mise = await api.modifierProfil(changements);
      onModifie(mise);
      setSucces(true);
      fermer();
    } catch (err) {
      if (err instanceof ErreurApi && Object.keys(err.champs).length > 0) {
        const e2: Erreurs = {};
        for (const [cle, message] of Object.entries(err.champs)) {
          if (ORDRE.includes(cle as keyof Valeurs)) e2[cle as keyof Valeurs] = message;
        }
        setErreurs(e2);
        allerAuPremier(e2);
      } else {
        setProbleme(err instanceof ErreurApi ? err.message : 'L’enregistrement a échoué. Réessayez.');
      }
    } finally {
      setEnCours(false);
    }
  };

  const infos: [string, string][] = [
    ['Nom', entreprise.nom],
    ['Type d’activité', entreprise.typeActivite],
    ['Adresse', entreprise.adresse],
    ['E-mail', entreprise.email],
    ['Compte créé le', formaterDateHeure(entreprise.creeLe)],
    ['Justificatif', entreprise.justificatifFourni ? 'Reçu' : 'Pas encore envoyé'],
  ];

  return (
    <section className="carte bloc" aria-labelledby="titre-infos">
      <div className="barre-section">
        <h2 id="titre-infos" className="t-sous-titre">
          Votre établissement
        </h2>
        {!edition && (
          <button ref={boutonModifier} type="button" className="bouton bouton-secondaire bouton-petit" onClick={ouvrir}>
            <Pencil size={16} aria-hidden="true" />
            Modifier
          </button>
        )}
      </div>

      {succes && !edition && <Alerte type="succes">Vos informations ont été mises à jour.</Alerte>}

      {edition ? (
        <form ref={formulaire} className="formulaire-compact" onSubmit={enregistrer} noValidate>
          <Champ
            libelle="Nom de l’établissement"
            name="nom"
            required
            autoComplete="organization"
            value={v.nom}
            onChange={(e) => changer('nom', e.target.value)}
            erreur={erreurs.nom}
          />
          <Champ
            libelle="Type d’activité"
            name="typeActivite"
            required
            value={v.typeActivite}
            onChange={(e) => changer('typeActivite', e.target.value)}
            erreur={erreurs.typeActivite}
            sous={
              <div className="suggestions" role="group" aria-label="Suggestions de type d’activité">
                {TYPES_ACTIVITE.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className="suggestion"
                    aria-pressed={v.typeActivite === type}
                    onClick={() => changer('typeActivite', type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            }
          />
          <Champ
            libelle="Adresse"
            name="adresse"
            required
            autoComplete="street-address"
            value={v.adresse}
            onChange={(e) => changer('adresse', e.target.value)}
            erreur={erreurs.adresse}
          />
          <p className="t-legende secondaire">
            L’adresse e-mail du compte ({entreprise.email}) ne peut pas être modifiée ici. Contactez l’administration AiCity
            si besoin.
          </p>

          {probleme && <Alerte type="erreur">{probleme}</Alerte>}

          <div className="actions-formulaire">
            <button type="button" className="bouton bouton-secondaire" onClick={fermer} disabled={enCours}>
              Annuler
            </button>
            <button type="submit" className="bouton bouton-primaire" disabled={enCours} aria-busy={enCours}>
              {enCours ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      ) : (
        <dl className="lignes">
          {infos.map(([libelle, valeur]) => (
            <div key={libelle} className="ligne">
              <dt className="secondaire">{libelle}</dt>
              <dd className="t-corps-fort chiffres">{valeur}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
