import { Link } from 'react-router-dom';

// Même dessin que le logo de l'appli citoyen (frontend/src/components/AiCityLogo.tsx).
export function Logo({ surNuit = false }: { surNuit?: boolean }) {
  const fond = surNuit ? '#082B38' : '#FFFFFF';
  return (
    <Link to="/" className="logo" aria-label="AiCity Pro, accueil">
      <svg viewBox="0 0 80 80" width="32" height="32" fill="none" aria-hidden="true">
        <rect x="6" y="38" width="12" height="28" rx="2" fill="#42A8B7" />
        <rect x="20" y="26" width="10" height="40" rx="2" fill="#42A8B7" />
        <rect x="32" y="18" width="16" height="48" rx="2" fill={fond} stroke="#42A8B7" strokeWidth="2" />
        <rect x="50" y="30" width="10" height="36" rx="2" fill="#42A8B7" />
        <rect x="62" y="42" width="12" height="24" rx="2" fill="#42A8B7" />
        <path
          d="M12 30 L12 22 L26 22 L26 16 L40 16 L40 10 L55 10 L55 22 L68 22 L68 34"
          stroke="#42A8B7"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="30" r="3" fill={fond} stroke="#42A8B7" strokeWidth="2" />
        <circle cx="40" cy="10" r="3" fill={fond} stroke="#42A8B7" strokeWidth="2" />
        <circle cx="68" cy="34" r="3" fill={fond} stroke="#42A8B7" strokeWidth="2" />
      </svg>
      <span className="logo-mot">
        Ai<span className="accent">City</span>
      </span>
      <span className="logo-pro">Pro</span>
    </Link>
  );
}
