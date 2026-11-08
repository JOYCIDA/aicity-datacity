import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, ShieldCheck } from 'lucide-react';
import { api, ErreurApi, jeton } from '../api';
import { useAuth } from '../auth';
import { Alerte } from '../composants/Alerte';
import { Champ } from '../composants/Champ';
import { MiseEnPageAuth } from '../composants/MiseEnPageAuth';

type Probleme = { type: 'erreur' | 'alerte'; texte: string };

// Après connexion, on revient sur la page demandée (?redirect=/offres) si elle est interne.
function destination(redirect: string | null) {
  return redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/';
}

export default function Connexion() {
  const { utilisateur, sessionExpiree, ouvrirSession } = useAuth();
  const navigate = useNavigate();
  const [parametres] = useSearchParams();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [probleme, setProbleme] = useState<Probleme | null>(null);

  if (utilisateur?.role === 'ENTREPRISE') return <Navigate to={destination(parametres.get('redirect'))} replace />;

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    setProbleme(null);
    if (email.trim() === '' || motDePasse === '') {
      setProbleme({ type: 'erreur', texte: 'Renseignez votre adresse e-mail et votre mot de passe.' });
      return;
    }
    setEnCours(true);
    try {
      const { token, utilisateur: compte } = await api.connexion(email, motDePasse);
      // Espace réservé aux entreprises : on ne garde pas la session d'un autre type de compte.
      if (compte.role !== 'ENTREPRISE') {
        jeton.effacer();
        setProbleme({ type: 'alerte', texte: 'Ce compte n’est pas un compte entreprise.' });
        return;
      }
      await ouvrirSession(token);
      navigate(destination(parametres.get('redirect')), { replace: true });
    } catch (err) {
      const texte =
        err instanceof ErreurApi && err.statut === 401
          ? 'Identifiants invalides. Vérifiez votre e-mail et votre mot de passe.'
          : err instanceof ErreurApi && err.statut === 429
            ? 'Trop de tentatives. Réessayez dans quelques minutes.'
            : err instanceof ErreurApi
              ? err.message
              : 'Une erreur est survenue. Réessayez dans quelques instants.';
      setProbleme({ type: 'erreur', texte });
    } finally {
      setEnCours(false);
    }
  };

  return (
    <MiseEnPageAuth
      accroche="Bon retour parmi nous"
      sousAccroche="Gérez vos offres, suivez vos statistiques et touchez votre audience locale."
      atouts={[
        {
          icone: ShieldCheck,
          titre: 'Accès sécurisé',
          texte: 'Connexion chiffrée, sessions protégées et limitation des tentatives.',
        },
        {
          icone: Building2,
          titre: 'Réservé aux entreprises',
          texte: 'Seuls les comptes entreprise peuvent accéder à cet espace.',
        },
      ]}
    >
      <div>
        <h1 className="t-affiche">Se connecter</h1>
        <p className="t-corps secondaire" style={{ marginTop: 'var(--e-s)' }}>
          Accédez à votre espace entreprise AiCity Pro.
        </p>
      </div>

      {sessionExpiree && !probleme && <Alerte type="info">Votre session a expiré. Reconnectez-vous.</Alerte>}
      {probleme && <Alerte type={probleme.type}>{probleme.texte}</Alerte>}

      <form className="carte formulaire" onSubmit={envoyer} noValidate>
        <Champ
          libelle="Adresse e-mail"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Champ
          libelle="Mot de passe"
          type="password"
          autoComplete="current-password"
          required
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
        />
        <Link
          to={email.trim() ? `/mot-de-passe-oublie?email=${encodeURIComponent(email.trim())}` : '/mot-de-passe-oublie'}
          className="lien-discret"
        >
          Mot de passe oublié ?
        </Link>
        <button type="submit" className="bouton bouton-primaire bouton-large" disabled={enCours} aria-busy={enCours}>
          {enCours ? 'Connexion…' : 'Se connecter'}
        </button>
        <p className="t-corps secondaire" style={{ textAlign: 'center' }}>
          Pas encore de compte ? <Link to="/inscription">Créer mon espace</Link>
        </p>
      </form>
    </MiseEnPageAuth>
  );
}
