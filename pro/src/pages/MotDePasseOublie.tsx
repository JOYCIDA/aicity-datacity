import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { MiseEnPageAuth } from '../composants/MiseEnPageAuth';

// Adresse de l'administration AiCity (modifiable dans .env.local).
const CONTACT = import.meta.env.VITE_CONTACT_ADMIN ?? 'admin@aicity.fr';

// Le backend ne sait pas encore envoyer de lien de réinitialisation par e-mail :
// l'entreprise écrit à l'administration, qui vérifie son identité et réinitialise l'accès.
export default function MotDePasseOublie() {
  const [parametres] = useSearchParams();
  const email = parametres.get('email') ?? '';
  const sujet = 'AiCity Pro : mot de passe oublié';
  const corps = [
    'Bonjour,',
    '',
    'J’ai oublié le mot de passe de mon espace AiCity Pro.',
    `Adresse e-mail du compte : ${email || '(à compléter)'}`,
    'Nom de l’établissement : (à compléter)',
    '',
    'Merci de réinitialiser mon accès.',
  ].join('\n');
  const lien = `mailto:${CONTACT}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;

  return (
    <MiseEnPageAuth
      accroche="Retrouver l’accès à votre espace"
      sousAccroche="Votre compte est protégé : l’administration vérifie votre identité avant de réinitialiser l’accès."
      atouts={[
        {
          icone: ShieldCheck,
          titre: 'Vérification humaine',
          texte: 'Aucun mot de passe n’est envoyé par e-mail ; l’administration vous recontacte.',
        },
      ]}
    >
      <Link to="/connexion" className="lien-discret lien-retour">
        <ArrowLeft size={16} aria-hidden="true" />
        Retour à la connexion
      </Link>
      <div>
        <h1 className="t-affiche">Mot de passe oublié</h1>
        <p className="t-corps secondaire" style={{ marginTop: 'var(--e-s)' }}>
          Écrivez à l’administration AiCity depuis l’adresse e-mail de votre compte. Elle vérifie qu’il s’agit bien de
          vous, puis réinitialise votre accès.
        </p>
      </div>
      <div className="carte formulaire">
        <ol className="etapes t-corps">
          <li>Cliquez sur le bouton ci-dessous : un e-mail déjà rédigé s’ouvre.</li>
          <li>Complétez le nom de votre établissement, puis envoyez-le.</li>
          <li>L’administration vous répond pour rétablir l’accès.</li>
        </ol>
        <a href={lien} className="bouton bouton-primaire bouton-large">
          <Mail size={18} aria-hidden="true" />
          Écrire à l’administration
        </a>
        <p className="t-legende secondaire" style={{ textAlign: 'center' }}>
          Ou écrivez directement à <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
        </p>
      </div>
    </MiseEnPageAuth>
  );
}
