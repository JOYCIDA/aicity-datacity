export function formaterPrix(prix: number | null): string {
  if (prix === null) return 'Prix non communiqué';
  if (prix === 0) return 'Gratuit';
  return `${String(prix).replace('.', ',')} €`;
}

export function formaterDistance(metres: number): string {
  if (metres < 1000) return `${metres} m`;
  return `${(metres / 1000).toFixed(1).replace('.', ',')} km`;
}

export function formaterDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR');
}

function jourEtHeure(iso: string): string {
  const d = new Date(iso);
  const jour = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${jour} à ${heure}`;
}

// Quand le backend ne donne pas d'horaires, on les déduit des dates de début et de fin.
export function formaterHoraires(horaires: string | null, debut: string, fin: string | null): string {
  if (horaires) return horaires;
  const maintenant = new Date();
  if (!fin) return `À partir du ${jourEtHeure(debut)}`;
  if (new Date(debut) <= maintenant) return `En cours, jusqu'au ${jourEtHeure(fin)}`;
  return `Du ${jourEtHeure(debut)} au ${jourEtHeure(fin)}`;
}

export const LIBELLES_SOURCE: Record<string, string> = {
  ENTREPRISE: 'Partenaire AiCity',
  OPENAGENDA: 'OpenAgenda',
  DATA_GOUV: 'data.gouv.fr',
  PARIS_OPEN_DATA: 'Paris Open Data',
};
