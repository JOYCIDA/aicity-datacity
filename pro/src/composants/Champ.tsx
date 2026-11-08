import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  libelle: string;
  aide?: string;
  erreur?: string;
  sous?: ReactNode; // contenu affiché sous le champ (jauge, suggestions…)
};

// Champ avec libellé visible, aide et erreur reliées au champ pour les lecteurs d'écran.
// Une erreur est toujours un texte avec une icône, jamais la couleur seule.
export function Champ({ libelle, aide, erreur, sous, required, type = 'text', ...saisie }: Props) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const motDePasse = type === 'password';
  const decrit = [aide && `${id}-aide`, erreur && `${id}-erreur`].filter(Boolean).join(' ') || undefined;

  return (
    <div className="champ">
      <label htmlFor={id} className="champ-libelle">
        {libelle}
        {required && (
          <span className="obligatoire" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="champ-saisie">
        <input
          id={id}
          type={motDePasse && visible ? 'text' : type}
          required={required}
          aria-invalid={erreur ? true : undefined}
          aria-describedby={decrit}
          className={motDePasse ? 'avec-oeil' : undefined}
          {...saisie}
        />
        {motDePasse && (
          <button
            type="button"
            className="champ-bouton-oeil"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            aria-pressed={visible}
          >
            {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
          </button>
        )}
      </div>
      {sous}
      {aide && (
        <p id={`${id}-aide`} className="champ-aide">
          {aide}
        </p>
      )}
      {erreur && (
        <p id={`${id}-erreur`} className="champ-erreur">
          <AlertCircle size={16} aria-hidden="true" />
          {erreur}
        </p>
      )}
    </div>
  );
}
