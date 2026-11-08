import { useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BarChart3, MapPin, Megaphone } from 'lucide-react';
import { api, ErreurApi } from '../api';
import { useAuth } from '../auth';
import { Alerte } from '../composants/Alerte';
import { Champ } from '../composants/Champ';
import { MiseEnPageAuth } from '../composants/MiseEnPageAuth';

const TYPES_ACTIVITE = ['Musée', 'Restaurant', 'Café', 'Salle de sport', 'Commerce', 'Association', 'Théâtre', 'Cinéma', 'Parc / Jardin'];

type Valeurs = {
  email: string;
  motDePasse: string;
  confirmation: string;
  nom: string;
  typeActivite: string;
  adresse: string;
  accord: boolean;
};
type Erreurs = Partial<Record<keyof Valeurs, string>>;

// Mêmes règles que le backend (backend/src/schemas/auth.schema.ts), vérifiées avant l'envoi.
function verifier(v: Valeurs): Erreurs {
  const e: Erreurs = {};
  const email = v.email.trim();
  if (!email) e.email = 'Renseignez votre adresse e-mail.';
  else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Adresse e-mail invalide.';
  if (v.motDePasse.length < 8) e.motDePasse = 'Au moins 8 caractères.';
  else if (v.motDePasse.length > 72) e.motDePasse = '72 caractères au maximum.';
  if (v.confirmation !== v.motDePasse) e.confirmation = 'Les deux mots de passe ne sont pas identiques.';
  const nom = v.nom.trim().length;
  if (nom < 2 || nom > 120) e.nom = 'Entre 2 et 120 caractères.';
  const type = v.typeActivite.trim().length;
  if (type < 2 || type > 120) e.typeActivite = 'Choisissez ou saisissez votre type d’activité (2 à 120 caractères).';
  const adresse = v.adresse.trim().length;
  if (adresse < 5 || adresse > 250) e.adresse = 'Entre 5 et 250 caractères.';
  if (!v.accord) e.accord = 'Cochez cette case pour continuer.';
  return e;
}

// Indication de solidité, affichée en barres ET en mot (jamais la couleur seule).
function force(motDePasse: string): { niveau: number; libelle: string } {
  if (!motDePasse) return { niveau: 0, libelle: '' };
  let points = 0;
  if (motDePasse.length >= 8) points++;
  if (motDePasse.length >= 12) points++;
  if (/[a-z]/.test(motDePasse) && /[A-Z]/.test(motDePasse)) points++;
  if (/\d/.test(motDePasse) && /[^A-Za-z0-9]/.test(motDePasse)) points++;
  return { niveau: Math.max(points, 1), libelle: ['Faible', 'Faible', 'Moyen', 'Bon', 'Solide'][points] };
}

// Correspondance entre les champs renvoyés par le backend et ceux du formulaire.
const CHAMPS_SERVEUR: Record<string, keyof Valeurs> = {
  email: 'email',
  motDePasse: 'motDePasse',
  'entreprise.nom': 'nom',
  'entreprise.typeActivite': 'typeActivite',
  'entreprise.adresse': 'adresse',
};

const ORDRE: (keyof Valeurs)[] = ['email', 'motDePasse', 'confirmation', 'nom', 'typeActivite', 'adresse', 'accord'];

export default function Inscription() {
  const { utilisateur, ouvrirSession } = useAuth();
  const navigate = useNavigate();
  const formulaire = useRef<HTMLFormElement>(null);
  const [v, setV] = useState<Valeurs>({
    email: '',
    motDePasse: '',
    confirmation: '',
    nom: '',
    typeActivite: '',
    adresse: '',
    accord: false,
  });
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [probleme, setProbleme] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  if (utilisateur?.role === 'ENTREPRISE') return <Navigate to="/" replace />;

  const changer = <K extends keyof Valeurs>(cle: K, valeur: Valeurs[K]) => {
    setV((ancien) => ({ ...ancien, [cle]: valeur }));
    // L'erreur d'un champ disparaît dès qu'on le corrige.
    if (erreurs[cle]) setErreurs((ancien) => ({ ...ancien, [cle]: undefined }));
  };

  // Place le curseur sur le premier champ en erreur : plus rapide, et annoncé au lecteur d'écran.
  const allerAuPremier = (e: Erreurs) => {
    const premier = ORDRE.find((c) => e[c]);
    if (!premier) return;
    requestAnimationFrame(() => {
      formulaire.current?.querySelector<HTMLElement>(`[name="${premier}"]`)?.focus();
    });
  };

  const envoyer = async (ev: FormEvent) => {
    ev.preventDefault();
    setProbleme(null);
    const e = verifier(v);
    setErreurs(e);
    if (Object.keys(e).length > 0) {
      allerAuPremier(e);
      return;
    }
    setEnCours(true);
    try {
      const { token } = await api.inscription({
        email: v.email.trim(),
        motDePasse: v.motDePasse,
        entreprise: { nom: v.nom.trim(), typeActivite: v.typeActivite.trim(), adresse: v.adresse.trim() },
      });
      await ouvrirSession(token);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ErreurApi && err.statut === 409) {
        const e2 = { email: 'Cette adresse e-mail est déjà utilisée. Connectez-vous ou utilisez une autre adresse.' };
        setErreurs(e2);
        allerAuPremier(e2);
      } else if (err instanceof ErreurApi && Object.keys(err.champs).length > 0) {
        const e2: Erreurs = {};
        for (const [cle, message] of Object.entries(err.champs)) {
          const champ = CHAMPS_SERVEUR[cle];
          if (champ) e2[champ] = message;
        }
        setErreurs(e2);
        allerAuPremier(e2);
      } else if (err instanceof ErreurApi && err.statut === 429) {
        setProbleme('Trop de tentatives. Réessayez dans quelques minutes.');
      } else {
        setProbleme(err instanceof ErreurApi ? err.message : 'Une erreur est survenue. Réessayez dans quelques instants.');
      }
    } finally {
      setEnCours(false);
    }
  };

  const solidite = force(v.motDePasse);

  return (
    <MiseEnPageAuth
      accroche="Votre vitrine auprès des habitants"
      sousAccroche="Publiez vos offres en quelques minutes et touchez une audience locale."
      atouts={[
        { icone: Megaphone, titre: 'Publiez facilement', texte: 'Sorties, événements et promotions, depuis votre tableau de bord.' },
        { icone: MapPin, titre: 'Touchez les habitants à proximité', texte: 'AiCity recommande vos offres selon la position et le temps libre de chacun.' },
        { icone: BarChart3, titre: 'Statistiques anonymes', texte: 'Suivez vues et recommandations sans aucune donnée personnelle.' },
      ]}
    >
      <div>
        <h1 className="t-affiche">Créer mon espace entreprise</h1>
        <p className="t-corps secondaire" style={{ marginTop: 'var(--e-s)' }}>
          Votre compte sera vérifié par l’administration avant toute publication.
        </p>
      </div>

      {probleme && <Alerte type="erreur">{probleme}</Alerte>}

      <form ref={formulaire} className="carte formulaire" onSubmit={envoyer} noValidate>
        <p className="t-legende secondaire">
          Les champs marqués d’un <span className="obligatoire">*</span> sont obligatoires.
        </p>

        <fieldset>
          <legend className="t-sous-titre">Votre compte</legend>
          <Champ
            libelle="Adresse e-mail"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="contact@exemple.fr"
            value={v.email}
            onChange={(e) => changer('email', e.target.value)}
            erreur={erreurs.email}
          />
          <Champ
            libelle="Mot de passe"
            name="motDePasse"
            type="password"
            autoComplete="new-password"
            required
            aide="8 caractères au minimum."
            value={v.motDePasse}
            onChange={(e) => changer('motDePasse', e.target.value)}
            erreur={erreurs.motDePasse}
            sous={
              solidite.niveau > 0 && (
                <div className="force" aria-live="polite">
                  <div className="force-barres" aria-hidden="true">
                    {[1, 2, 3, 4].map((n) => (
                      <span key={n} className={n <= solidite.niveau ? 'pleine' : undefined} />
                    ))}
                  </div>
                  <span className="t-legende secondaire">Solidité : {solidite.libelle}</span>
                </div>
              )
            }
          />
          <Champ
            libelle="Confirmer le mot de passe"
            name="confirmation"
            type="password"
            autoComplete="new-password"
            required
            value={v.confirmation}
            onChange={(e) => changer('confirmation', e.target.value)}
            erreur={erreurs.confirmation}
          />
        </fieldset>

        <hr className="separateur" />

        <fieldset>
          <legend className="t-sous-titre">Votre établissement</legend>
          <Champ
            libelle="Nom de l’établissement"
            name="nom"
            required
            autoComplete="organization"
            placeholder="Ex. : Musée des Arts décoratifs"
            value={v.nom}
            onChange={(e) => changer('nom', e.target.value)}
            erreur={erreurs.nom}
          />
          <Champ
            libelle="Type d’activité"
            name="typeActivite"
            required
            placeholder="Choisissez ci-dessous ou saisissez librement"
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
            placeholder="Ex. : 12 rue de Rivoli, 75001 Paris"
            value={v.adresse}
            onChange={(e) => changer('adresse', e.target.value)}
            erreur={erreurs.adresse}
          />
        </fieldset>

        <hr className="separateur" />

        <div className="champ">
          <label className="case">
            <input
              type="checkbox"
              name="accord"
              checked={v.accord}
              onChange={(e) => changer('accord', e.target.checked)}
              aria-invalid={erreurs.accord ? true : undefined}
              aria-describedby={erreurs.accord ? 'erreur-accord' : undefined}
            />
            <span>
              J’accepte que mon compte soit vérifié par l’administration d’AiCity avant la publication de mes offres.
              <span className="obligatoire" aria-hidden="true">
                *
              </span>
            </span>
          </label>
          {erreurs.accord && (
            <p id="erreur-accord" className="champ-erreur">
              {erreurs.accord}
            </p>
          )}
        </div>

        <button type="submit" className="bouton bouton-primaire bouton-large" disabled={enCours} aria-busy={enCours}>
          {enCours ? 'Création du compte…' : 'Créer mon compte entreprise'}
        </button>
        <p className="t-corps secondaire" style={{ textAlign: 'center' }}>
          Déjà un compte ? <Link to="/connexion">Se connecter</Link>
        </p>
      </form>
    </MiseEnPageAuth>
  );
}
