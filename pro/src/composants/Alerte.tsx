import type { ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, type LucideIcon } from 'lucide-react';

type Type = 'erreur' | 'alerte' | 'succes' | 'info';

const ICONES: Record<Type, LucideIcon> = {
  erreur: AlertCircle,
  alerte: AlertTriangle,
  succes: CheckCircle2,
  info: Info,
};

// Message en bloc : icône + texte ; les erreurs sont annoncées aux lecteurs d'écran.
export function Alerte({ type, titre, children }: { type: Type; titre?: string; children?: ReactNode }) {
  const Icone = ICONES[type];
  return (
    <div className={`alerte alerte-${type}`} role={type === 'erreur' ? 'alert' : 'status'}>
      <Icone size={20} aria-hidden="true" />
      <div>
        {titre && <p className="t-corps-fort">{titre}</p>}
        {children && <div className="t-corps">{children}</div>}
      </div>
    </div>
  );
}
