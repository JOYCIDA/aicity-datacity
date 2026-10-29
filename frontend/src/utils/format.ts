import { Textes } from '../i18n';

export function formaterPrix(prix: number | null, t: Textes): string {
  if (prix === null) return t.prixInconnu;
  if (prix === 0) return t.gratuit;
  return t.locale === 'fr-FR' ? `${String(prix).replace('.', ',')} €` : `€${prix}`;
}

export function formaterDistance(metres: number): string {
  if (metres < 1000) return `${metres} m`;
  return `${(metres / 1000).toFixed(1).replace('.', ',')} km`;
}

export function formaterDate(iso: string, t: Textes): string {
  return new Date(iso).toLocaleDateString(t.locale);
}

function jourEtHeure(iso: string, t: Textes): string {
  const d = new Date(iso);
  // L'année n'est utile que si ce n'est pas l'année en cours (« jusqu'au 5 juillet 2027 »).
  const autreAnnee = d.getFullYear() !== new Date().getFullYear();
  const jour = d.toLocaleDateString(t.locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(autreAnnee && { year: 'numeric' }),
  });
  const heure = d.toLocaleTimeString(t.locale, { hour: '2-digit', minute: '2-digit' });
  return t.horaires.jourHeure(jour, heure);
}

// Quand le backend ne donne pas d'horaires, on les déduit des dates de début et de fin.
export function formaterHoraires(horaires: string | null, debut: string, fin: string | null, t: Textes): string {
  if (horaires) return horaires;
  const maintenant = new Date();
  if (!fin) return t.horaires.aPartirDu(jourEtHeure(debut, t));
  if (new Date(debut) <= maintenant) return t.horaires.enCours(jourEtHeure(fin, t));
  return t.horaires.duAu(jourEtHeure(debut, t), jourEtHeure(fin, t));
}
