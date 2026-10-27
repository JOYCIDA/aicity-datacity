// data.gouv.fr : jeu « Événements de GPSO publiés sur Open Agenda » par défaut. La ressource
// est un export OpenDataSoft d'OpenAgenda (title_fr, firstdate_begin, location_coordinates…),
// format commun à de nombreux agendas publiés sur data.gouv.fr. Champs relevés sur une
// réponse réelle, conservée dans data/datagouv.sample.json.
import { categoriser } from './categories.js';
import {
  coordonnees,
  dateOuNull,
  dureeEntre,
  type Fetch,
  mentionneGratuit,
  prixMinimum,
  recupererJson,
  type SourceAdapter,
  texteBrut,
  texteOuNull,
} from './source.adapter.js';

export interface EvenementDataGouv {
  uid: string;
  canonicalurl: string | null;
  title_fr: string | null;
  description_fr: string | null;
  conditions_fr: string | null;
  keywords_fr: string[] | null;
  originalimage: string | null;
  thumbnail: string | null;
  firstdate_begin: string | null;
  firstdate_end: string | null;
  lastdate_end: string | null;
  location_name: string | null;
  location_address: string | null;
  location_coordinates: { lon: number; lat: number } | null;
  status: string | null; // JSON sérialisé : {"id": 1, "label": {...}}
  attendancemode: string | null; // idem
}

const API = 'https://www.data.gouv.fr/api/1';
const STATUT_ANNULE = 6;
const MODE_EN_LIGNE = 2;

function idJson(v: string | null): number | null {
  if (!v) return null;
  try {
    const id = (JSON.parse(v) as { id?: unknown }).id;
    return typeof id === 'number' ? id : null;
  } catch {
    return null;
  }
}

export function creerDataGouvAdapter({
  dataset,
  ressource,
  fetch = globalThis.fetch,
}: {
  dataset: string;
  ressource: string;
  fetch?: Fetch;
}) {
  return {
    code: 'datagouv',
    source: 'DATA_GOUV',
    configurationManquante: () => null,

    // L'URL de téléchargement est relue sur data.gouv.fr à chaque import : le producteur
    // peut la changer sans que la configuration AiCity bouge.
    async recuperer() {
      const meta = await recupererJson<{ url?: string }>(
        fetch,
        `${API}/datasets/${encodeURIComponent(dataset)}/resources/${encodeURIComponent(ressource)}/`,
      );
      if (!meta.url) throw new Error('Ressource data.gouv.fr sans URL de téléchargement');
      const donnees = await recupererJson<unknown>(fetch, meta.url, { delaiMs: 300_000 });
      if (!Array.isArray(donnees)) throw new Error('Ressource data.gouv.fr inattendue : tableau JSON attendu');
      return donnees as EvenementDataGouv[];
    },

    normaliser(e) {
      if (idJson(e.status) === STATUT_ANNULE || idJson(e.attendancemode) === MODE_EN_LIGNE) return null;
      const position = coordonnees(e.location_coordinates?.lat, e.location_coordinates?.lon);
      const titre = texteBrut(e.title_fr, 150);
      const debut = dateOuNull(e.firstdate_begin);
      return {
        idExterne: String(e.uid),
        titre,
        description: texteBrut(e.description_fr),
        lieu: texteOuNull(e.location_name),
        adresse: texteBrut(e.location_address, 250),
        latitude: position?.latitude ?? null,
        longitude: position?.longitude ?? null,
        debut,
        fin: dateOuNull(e.lastdate_end),
        dureeMinutes: dureeEntre(debut, dateOuNull(e.firstdate_end)),
        categorieCode: categoriser(e.keywords_fr ?? [], titre),
        gratuit: mentionneGratuit(e.conditions_fr),
        prix: prixMinimum(e.conditions_fr),
        photoUrl: texteOuNull(e.originalimage) ?? texteOuNull(e.thumbnail),
        sourceUrl: texteOuNull(e.canonicalurl),
      };
    },
  } satisfies SourceAdapter<EvenementDataGouv>;
}
