// Mise en forme commune, en typographie française (espaces insécables entre nombre et unité).
import type { StatutOffre } from './api';

const INSECABLE = ' ';

export function formaterDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR');
}

export function formaterDateHeure(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
}

export function formaterPrix(prix: number | null, gratuit: boolean) {
  if (gratuit) return 'Gratuit';
  if (prix === null) return '—';
  return `${prix.toLocaleString('fr-FR', { minimumFractionDigits: prix % 1 ? 2 : 0, maximumFractionDigits: 2 })}${INSECABLE}€`;
}

export function formaterTaille(octets: number) {
  return octets < 1024 * 1024
    ? `${Math.max(1, Math.round(octets / 1024))}${INSECABLE}Ko`
    : `${(octets / 1024 / 1024).toFixed(1).replace('.', ',')}${INSECABLE}Mo`;
}

export const LIBELLES_STATUT_OFFRE: Record<StatutOffre, string> = {
  EN_ATTENTE: 'En attente',
  VALIDE: 'Publiée',
  REFUSE: 'Refusée',
  EN_PAUSE: 'En pause',
  EXPIREE: 'Expirée',
};
