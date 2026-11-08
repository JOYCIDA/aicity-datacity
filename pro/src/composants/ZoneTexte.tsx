import { useId, type TextareaHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  libelle: string;
  aide?: string;
  erreur?: string;
};

// Texte sur plusieurs lignes, avec compteur de caractères quand une limite existe.
export function ZoneTexte({ libelle, aide, erreur, required, maxLength, value, ...saisie }: Props) {
  const id = useId();
  const longueur = typeof value === 'string' ? value.length : 0;
  const decrit = [aide && `${id}-aide`, maxLength && `${id}-compteur`, erreur && `${id}-erreur`].filter(Boolean).join(' ') || undefined;

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
      <textarea
        id={id}
        required={required}
        maxLength={maxLength}
        value={value}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={decrit}
        {...saisie}
      />
      <div className="champ-pied">
        {aide && (
          <p id={`${id}-aide`} className="champ-aide">
            {aide}
          </p>
        )}
        {maxLength && (
          <p id={`${id}-compteur`} className="champ-aide chiffres compteur">
            {longueur}/{maxLength}
          </p>
        )}
      </div>
      {erreur && (
        <p id={`${id}-erreur`} className="champ-erreur">
          <AlertCircle size={16} aria-hidden="true" />
          {erreur}
        </p>
      )}
    </div>
  );
}
