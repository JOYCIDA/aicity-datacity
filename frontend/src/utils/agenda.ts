import type { Activite } from '../types/activite';

// « Ajouter à mon agenda » sans compte ni stockage chez nous : l'événement part dans l'agenda de la personne.
// Format iCalendar (RFC 5545), lu par Google Agenda, Apple Calendrier et Outlook.

export type Creneau = { debut: Date; fin: Date };

const MINUTE = 60_000;

// Même règle que la vue Créneau et le filtre du backend : on arrive après le trajet à pied,
// l'activité commence à l'arrivée ou à l'ouverture, et dure dureeMinutes.
export function creneauAgenda(a: Activite, maintenant = Date.now()): Creneau {
  const attente = (Date.parse(a.debut_iso) - maintenant) / MINUTE;
  const arrivee = maintenant + Math.max(a.trajet_min, attente) * MINUTE;
  // Arrondi aux 5 minutes suivantes : « 14 h 35 » plutôt que « 14 h 32 ».
  const debut = Math.ceil(arrivee / (5 * MINUTE)) * 5 * MINUTE;
  let fin = debut + Math.max(a.duree_min, 30) * MINUTE;
  const fermeture = a.fin_iso ? Date.parse(a.fin_iso) : NaN;
  if (fermeture > debut && fermeture < fin) fin = fermeture;
  return { debut: new Date(debut), fin: new Date(fin) };
}

// Heure UTC (suffixe Z) : le téléphone l'affiche dans son propre fuseau, sans ambiguïté.
const dateIcs = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

// Caractères réservés du format : \ ; , et retours à la ligne.
const echapper = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

const couper = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

const lieuComplet = (a: Activite) => (a.adresse && a.adresse !== a.lieu ? `${a.lieu}, ${a.adresse}` : a.lieu);

// Version courte pour le QR code de la borne : l'appareil photo du téléphone propose « Ajouter à l'agenda ».
// Titre et lieu raccourcis pour que le code reste petit et facile à scanner.
export function evenementQr(a: Activite, c: Creneau): string {
  return [
    'BEGIN:VEVENT',
    `SUMMARY:${echapper(couper(a.titre, 90))}`,
    `DTSTART:${dateIcs(c.debut)}`,
    `DTEND:${dateIcs(c.fin)}`,
    `LOCATION:${echapper(couper(lieuComplet(a), 110))}`,
    'END:VEVENT',
  ].join('\n');
}

// Lignes de 75 octets au plus, suite précédée d'une espace (règle du format) ; on coupe à 60 caractères par prudence.
const plier = (ligne: string) => {
  const morceaux: string[] = [];
  for (let i = 0; i < ligne.length; i += 60) morceaux.push(ligne.slice(i, i + 60));
  return morceaux.join('\r\n ');
};

// Fichier complet (.ics) pour le téléphone et l'ordinateur.
export function fichierIcs(a: Activite, c: Creneau, note: string): string {
  const description = a.source_url ? `${note}\n${a.source_url}` : note;
  return (
    [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AiCity//Appli citoyen//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${a.id}-${dateIcs(c.debut)}@aicity`,
      `DTSTAMP:${dateIcs(new Date())}`,
      `DTSTART:${dateIcs(c.debut)}`,
      `DTEND:${dateIcs(c.fin)}`,
      `SUMMARY:${echapper(a.titre)}`,
      `LOCATION:${echapper(lieuComplet(a))}`,
      `GEO:${a.lat};${a.lng}`,
      `DESCRIPTION:${echapper(description)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ]
      .map(plier)
      .join('\r\n') + '\r\n'
  );
}

// Appli installée (pas de fichier à télécharger) : lien Google Agenda pré-rempli, sans clé ni connexion côté AiCity.
export function lienGoogleAgenda(a: Activite, c: Creneau, note: string): string {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: a.titre,
    dates: `${dateIcs(c.debut)}/${dateIcs(c.fin)}`,
    location: lieuComplet(a),
    details: a.source_url ? `${note}\n${a.source_url}` : note,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

// Nom de fichier lisible et sans caractères spéciaux : « aicity-balade-en-mer.ics ».
export function nomFichierIcs(a: Activite): string {
  const base = a.titre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `aicity-${base || 'activite'}.ics`;
}
