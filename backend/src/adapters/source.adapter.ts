import { env } from '../config/env.js';
import type { SourceOffre } from '../generated/prisma/client.js';
import type { CodeCategorie } from './categories.js';

export const CODES_SOURCES = ['parisopendata', 'openagenda', 'datagouv'] as const;
export type CodeSource = (typeof CODES_SOURCES)[number];

/**
 * Offre au schéma unifié. Les champs obligatoires (titre, lieu, coordonnées, début) peuvent
 * être nuls : c'est le service d'import qui rejette et compte les événements incomplets.
 */
export interface OffreNormalisee {
  idExterne: string;
  titre: string | null;
  description: string | null;
  lieu: string | null;
  adresse: string | null;
  latitude: number | null;
  longitude: number | null;
  debut: Date | null;
  fin: Date | null;
  /** Durée d'une séance ; nulle si inconnue (la durée par défaut de la catégorie s'applique). */
  dureeMinutes: number | null;
  categorieCode: CodeCategorie;
  prix: number | null;
  gratuit: boolean;
  photoUrl: string | null;
  /** Crédit (droit d'auteur) à afficher sous la photo, si la source le fournit. */
  photoCredit?: string | null;
  /** Description de la photo, lue par les lecteurs d'écran. */
  photoAlt?: string | null;
  /** Version anglaise, si la source la fournit (sinon la traduction s'en charge). */
  titreEn?: string | null;
  descriptionEn?: string | null;
  lieuEn?: string | null;
  sourceUrl: string | null;
}

export interface SourceAdapter<Brut = unknown> {
  readonly code: CodeSource;
  readonly source: SourceOffre;
  /** Message expliquant ce qui manque (clé d'API…), ou null si la source peut être interrogée. */
  configurationManquante(): string | null;
  /** Événements bruts, tels que renvoyés par la source. */
  recuperer(): Promise<Brut[]>;
  /** Null si l'événement est hors périmètre (annulé, en ligne…), sans être une anomalie. */
  normaliser(brut: Brut): OffreNormalisee | null;
}

/** `fetch` injectable : les tests rejouent les fichiers d'essai de data/ sans réseau. */
export type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

const TENTATIVES = 3;
const PAUSE_MS = env.NODE_ENV === 'test' ? 0 : 2_000;

class ErreurSource extends Error {
  constructor(
    message: string,
    readonly reessayable: boolean,
  ) {
    super(message);
  }
}

/** Raison lisible d'un échec réseau : undici range la vraie cause dans `err.cause`. */
function raison(err: unknown): string {
  if (err instanceof Error && err.name === 'TimeoutError') return 'délai dépassé';
  const cause = (err as { cause?: { code?: string; message?: string } })?.cause;
  return cause?.code ?? cause?.message ?? (err instanceof Error ? err.message : String(err));
}

/**
 * GET JSON avec délai et nouvelles tentatives sur les pannes passagères (réseau, 5xx, 429).
 * Exemple vécu : un des trois serveurs de www.data.gouv.fr ne répondait plus.
 */
export async function recupererJson<T>(
  fetcher: Fetch,
  url: string,
  { headers, delaiMs = 60_000 }: { headers?: Record<string, string>; delaiMs?: number } = {},
): Promise<T> {
  const cible = `${new URL(url).host}${new URL(url).pathname}`;
  for (let essai = 1; ; essai++) {
    try {
      let res: Response;
      try {
        res = await fetcher(url, {
          headers: { Accept: 'application/json', ...headers },
          signal: AbortSignal.timeout(delaiMs),
        });
      } catch (err) {
        throw new ErreurSource(`${cible} injoignable (${raison(err)})`, true);
      }
      if (!res.ok) {
        throw new ErreurSource(`HTTP ${res.status} sur ${cible}`, res.status >= 500 || res.status === 429);
      }
      return (await res.json()) as T;
    } catch (err) {
      const reessayer = err instanceof ErreurSource && err.reessayable && essai < TENTATIVES;
      if (!reessayer) throw err;
      await new Promise((r) => setTimeout(r, PAUSE_MS * essai));
    }
  }
}

// --- Aides à la normalisation, communes aux adaptateurs ---

const ENTITES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** Texte lisible à partir de HTML ou de Markdown léger, tronqué à `max` caractères. */
export function texteBrut(valeur: string | null | undefined, max = 2000): string | null {
  if (!valeur) return null;
  const texte = valeur
    .replace(/<br\s*\/?>|<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&(\w+);/g, (m, e: string) => ENTITES[e.toLowerCase()] ?? m)
    .replace(/\*\*|__/g, '')
    .replace(/[ \t ]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
  if (!texte) return null;
  return texte.length > max ? `${texte.slice(0, max - 1).trimEnd()}…` : texte;
}

export function dateOuNull(valeur: string | null | undefined): Date | null {
  if (!valeur) return null;
  const d = new Date(valeur);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Coordonnées valides, en écartant le (0, 0) que certaines sources mettent faute de mieux. */
export function coordonnees(lat: unknown, lon: unknown): { latitude: number; longitude: number } | null {
  const la = Number(lat);
  const lo = Number(lon);
  if (lat == null || lon == null || !Number.isFinite(la) || !Number.isFinite(lo)) return null;
  if (Math.abs(la) > 90 || Math.abs(lo) > 180 || (la === 0 && lo === 0)) return null;
  return { latitude: la, longitude: lo };
}

/** Durée en minutes d'une séance, si elle est plausible (5 min à 12 h). */
export function dureeEntre(debut: Date | null, fin: Date | null): number | null {
  if (!debut || !fin) return null;
  const minutes = Math.round((fin.getTime() - debut.getTime()) / 60_000);
  return minutes >= 5 && minutes <= 12 * 60 ? minutes : null;
}

export const mentionneGratuit = (texte: string | null | undefined) =>
  !!texte && /\b(gratuit|entr[ée]e libre|free)\b/i.test(texte);

/** Plus petit montant en euros cité dans un texte libre (« 12 € », « 8,50€ », « 43.90 EUR »). */
export function prixMinimum(texte: string | null | undefined): number | null {
  if (!texte) return null;
  const montants = [...texte.matchAll(/(\d{1,4}(?:[.,]\d{1,2})?)\s?(?:€|eur(?:os?)?\b)/gi)].map((m) =>
    Number(m[1]!.replace(',', '.')),
  );
  return montants.length ? Math.min(...montants) : null;
}

export const texteOuNull = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
