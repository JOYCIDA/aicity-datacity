// API OpenAgenda v2 (clé obligatoire). Format relevé dans la documentation officielle :
// developers.openagenda.com/evenements/lecture et /evenements/structure.
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

// Avec `monolingual=fr`, les champs multilingues arrivent en texte simple ; on accepte
// aussi la forme { fr: … } au cas où une langue manquerait.
type Localise<T> = T | Record<string, T> | null | undefined;
type Plage = { begin: string; end: string } | null;

export interface EvenementOpenAgenda {
  uid: number;
  slug?: string;
  title?: Localise<string>;
  description?: Localise<string>;
  conditions?: Localise<string>;
  keywords?: Localise<string[]>;
  image?: { base: string; filename: string } | null;
  firstTiming?: Plage;
  lastTiming?: Plage;
  location?: {
    name?: string | null;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  attendanceMode?: number; // 1 sur place, 2 en ligne, 3 mixte
  status?: number; // 1 programmé … 6 annulé
  canonicalUrl?: string | null;
}

interface PageOpenAgenda {
  total: number;
  events: EvenementOpenAgenda[];
  after: string[] | null;
}

const API = 'https://api.openagenda.com/v2';
const TAILLE_PAGE = 300; // maximum autorisé par l'API
const PAGES_MAX = 50; // garde-fou : 15 000 événements par agenda

const STATUT_ANNULE = 6;
const MODE_EN_LIGNE = 2;

/** Version anglaise d'un champ multilingue, seulement si l'agenda la renseigne. */
function localiseEn<T>(v: Localise<T>): T | null {
  if (v == null || typeof v !== 'object' || Array.isArray(v)) return null;
  return (v as Record<string, T>).en ?? null;
}

function localise<T>(v: Localise<T>): T | null {
  if (v == null) return null;
  if (typeof v === 'object' && !Array.isArray(v)) {
    const parLangue = v as Record<string, T>;
    return parLangue.fr ?? Object.values(parLangue)[0] ?? null;
  }
  return v as T;
}

export function creerOpenAgendaAdapter({
  cle,
  agendas,
  fetch = globalThis.fetch,
}: {
  cle?: string;
  agendas: string[];
  fetch?: Fetch;
}) {
  return {
    code: 'openagenda',
    source: 'OPENAGENDA',

    configurationManquante() {
      if (!cle) return 'OPENAGENDA_API_KEY non renseignée';
      if (agendas.length === 0) return 'OPENAGENDA_AGENDAS non renseigné (identifiants d’agendas)';
      return null;
    },

    async recuperer() {
      const evenements: EvenementOpenAgenda[] = [];
      for (const agenda of agendas) {
        let after: string[] | null = [];
        for (let page = 0; after && page < PAGES_MAX; page++) {
          const params = new URLSearchParams({ monolingual: 'fr', detailed: '1', size: String(TAILLE_PAGE) });
          params.append('relative[]', 'current');
          params.append('relative[]', 'upcoming');
          for (const valeur of after) params.append('after[]', valeur);
          // Clé en en-tête : la documentation déconseille de la passer dans l'URL.
          const reponse: PageOpenAgenda = await recupererJson<PageOpenAgenda>(
            fetch,
            `${API}/agendas/${encodeURIComponent(agenda)}/events?${params}`,
            { headers: { key: cle! } },
          );
          evenements.push(...reponse.events);
          after = reponse.events.length ? reponse.after : null;
        }
      }
      return evenements;
    },

    normaliser(e) {
      if (e.status === STATUT_ANNULE || e.attendanceMode === MODE_EN_LIGNE) return null;
      const position = coordonnees(e.location?.latitude, e.location?.longitude);
      const titre = texteBrut(localise(e.title), 150);
      const conditions = localise(e.conditions);
      const premiere = e.firstTiming ?? null;
      const ville = [e.location?.postalCode, e.location?.city].filter(Boolean).join(' ');
      return {
        idExterne: String(e.uid),
        titre,
        description: texteBrut(localise(e.description)),
        lieu: texteOuNull(e.location?.name),
        adresse: texteOuNull(e.location?.address) ?? (ville || null),
        latitude: position?.latitude ?? null,
        longitude: position?.longitude ?? null,
        debut: dateOuNull(premiere?.begin),
        fin: dateOuNull(e.lastTiming?.end),
        dureeMinutes: dureeEntre(dateOuNull(premiere?.begin), dateOuNull(premiere?.end)),
        categorieCode: categoriser(localise(e.keywords) ?? [], titre),
        gratuit: mentionneGratuit(conditions),
        prix: prixMinimum(conditions),
        photoUrl: e.image ? `${e.image.base}${e.image.filename}` : null,
        titreEn: texteBrut(localiseEn(e.title), 150),
        descriptionEn: texteBrut(localiseEn(e.description)),
        sourceUrl: texteOuNull(e.canonicalUrl),
      };
    },
  } satisfies SourceAdapter<EvenementOpenAgenda>;
}
