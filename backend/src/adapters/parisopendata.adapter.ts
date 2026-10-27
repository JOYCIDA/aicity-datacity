// « Que faire à Paris ? » (opendata.paris.fr, sans clé). Noms de champs relevés sur une
// réponse réelle, conservée dans data/parisopendata.sample.json.
import { categoriser } from './categories.js';
import {
  coordonnees,
  dateOuNull,
  dureeEntre,
  type Fetch,
  prixMinimum,
  recupererJson,
  type SourceAdapter,
  texteBrut,
  texteOuNull,
} from './source.adapter.js';

export interface EvenementParis {
  id: string;
  url: string | null;
  title: string | null;
  lead_text: string | null;
  description: string | null;
  date_start: string | null;
  date_end: string | null;
  cover_url: string | null;
  address_name: string | null;
  address_street: string | null;
  address_zipcode: string | null;
  address_city: string | null;
  lat_lon: { lat: number; lon: number } | null;
  price_type: 'gratuit' | 'payant' | 'gratuit sous condition' | null;
  price_detail: string | null;
  qfap_tags: string | null; // « Concert;Festival »
  updated_at: string | null;
}

const EXPORT =
  'https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/que-faire-a-paris-/exports/json';
const CHAMPS: (keyof EvenementParis)[] = [
  'id', 'url', 'title', 'lead_text', 'description', 'date_start', 'date_end', 'cover_url',
  'address_name', 'address_street', 'address_zipcode', 'address_city', 'lat_lon',
  'price_type', 'price_detail', 'qfap_tags', 'updated_at',
];

export function creerParisOpenDataAdapter({ fetch = globalThis.fetch }: { fetch?: Fetch } = {}) {
  return {
    code: 'parisopendata',
    source: 'PARIS_OPEN_DATA',
    configurationManquante: () => null,

    // L'export renvoie tout le jeu filtré en une requête (~3 300 événements, 8 Mo).
    recuperer() {
      const params = new URLSearchParams({
        select: CHAMPS.join(','),
        where: 'date_end >= now() or date_end is null',
      });
      return recupererJson<EvenementParis[]>(fetch, `${EXPORT}?${params}`, { delaiMs: 180_000 });
    },

    normaliser(e) {
      const position = coordonnees(e.lat_lon?.lat, e.lat_lon?.lon);
      const debut = dateOuNull(e.date_start);
      const fin = dateOuNull(e.date_end);
      const titre = texteBrut(e.title, 150);
      const zipVille = [e.address_zipcode?.trim(), e.address_city?.trim()].filter(Boolean).join(' ');
      return {
        idExterne: String(e.id),
        titre,
        description: texteBrut(e.lead_text) ?? texteBrut(e.description),
        lieu: texteOuNull(e.address_name) ?? texteOuNull(e.address_street),
        adresse: [texteOuNull(e.address_street), zipVille].filter(Boolean).join(', ') || null,
        latitude: position?.latitude ?? null,
        longitude: position?.longitude ?? null,
        debut,
        fin,
        // date_start/date_end couvrent parfois des semaines : seule une plage courte fait une durée.
        dureeMinutes: dureeEntre(debut, fin),
        categorieCode: categoriser(e.qfap_tags?.split(';') ?? [], titre),
        // « gratuit sous condition » (réservation, tranche d'âge…) n'est pas compté gratuit.
        gratuit: e.price_type === 'gratuit',
        prix: e.price_type === 'payant' ? prixMinimum(texteBrut(e.price_detail)) : null,
        photoUrl: texteOuNull(e.cover_url),
        sourceUrl: texteOuNull(e.url),
      };
    },
  } satisfies SourceAdapter<EvenementParis>;
}
