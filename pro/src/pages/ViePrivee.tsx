import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth';
import { Logo } from '../composants/Logo';
import { PiedDePage } from '../composants/PiedDePage';

const CONTACT = import.meta.env.VITE_CONTACT_ADMIN ?? 'admin@aicity.fr';

// Chaque phrase doit rester vraie côté serveur (backend/) : à mettre à jour si le backend change
// (durée de conservation, données enregistrées…).
const SECTIONS: { titre: string; texte: string }[] = [
  {
    titre: 'Ce que vous voyez',
    texte:
      'Des compteurs totaux de vues, de recommandations et de favoris pour vos offres, jour par jour. Une vue est comptée quand un habitant ouvre la fiche de votre offre.',
  },
  {
    titre: 'Ce que vous ne voyez pas',
    texte:
      'Aucun identifiant d’habitant, aucune position, aucune adresse, aucun profil individuel. Les chiffres sont calculés sur le serveur avant de vous être transmis.',
  },
  {
    titre: 'Côté habitants',
    texte:
      'L’appli AiCity s’utilise sans compte. La position sert uniquement à calculer les distances et n’est jamais enregistrée. Les sessions de borne sont effacées dès qu’elles expirent.',
  },
  {
    titre: 'Les données de votre établissement',
    texte:
      'Nous enregistrons l’adresse e-mail du compte, le mot de passe sous une forme protégée (illisible, même pour AiCity), le nom, le type d’activité et l’adresse de l’établissement, ainsi que le justificatif. Seule l’administration AiCity consulte le justificatif ; quand vous en envoyez un nouveau, l’ancien est supprimé.',
  },
  {
    titre: 'Durée de conservation',
    texte:
      'Les compteurs d’une offre sont conservés tant que l’offre existe et supprimés avec elle. Les informations de votre établissement sont conservées tant que votre compte existe.',
  },
];

export default function ViePrivee() {
  const { utilisateur } = useAuth();
  const connecte = utilisateur?.role === 'ENTREPRISE';

  return (
    <div className="page-simple">
      <header className="page-simple-entete">
        <Logo />
        <Link to={connecte ? '/' : '/connexion'} className="lien-fleche">
          <ArrowLeft size={16} aria-hidden="true" />
          {connecte ? 'Retour au tableau de bord' : 'Retour à la connexion'}
        </Link>
      </header>

      <main className="page-lecture">
        <article className="carte vie-privee">
          <header className="vie-privee-entete">
            <ShieldCheck size={24} aria-hidden="true" className="vie-privee-icone" />
            <h1 className="t-titre">Vos données et celles des habitants</h1>
          </header>
          <p className="t-corps secondaire">
            AiCity Pro vous permet de suivre l’audience de vos offres sans jamais exposer les habitants qui utilisent
            AiCity. Voici précisément ce qui est enregistré et ce que vous pouvez voir.
          </p>

          {SECTIONS.map((s) => (
            <section key={s.titre} className="vie-privee-section">
              <h2 className="t-corps-fort">{s.titre}</h2>
              <p className="t-corps secondaire">{s.texte}</p>
            </section>
          ))}

          <section className="vie-privee-section">
            <h2 className="t-corps-fort">Contact</h2>
            <p className="t-corps secondaire">
              Pour toute question sur vos données, ou pour demander leur suppression&nbsp;:{' '}
              <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
            </p>
          </section>
        </article>
      </main>

      <PiedDePage />
    </div>
  );
}
