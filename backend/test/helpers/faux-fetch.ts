// Rejoue les jeux d'essai de data/ à la place du réseau.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Fetch } from '../../src/adapters/source.adapter.js';

const DATA = path.resolve(import.meta.dirname, '../../data');

export const jeuEssai = <T = any>(nom: string): T =>
  JSON.parse(readFileSync(path.join(DATA, nom), 'utf8')) as T;

export const reponseJson = (donnees: unknown) =>
  new Response(JSON.stringify(donnees), { status: 200, headers: { 'Content-Type': 'application/json' } });

/** fetch factice qui journalise les appels et répond via `repondre`. */
export function fauxFetch(repondre: (url: URL, init?: RequestInit) => unknown) {
  const appels: { url: URL; init?: RequestInit }[] = [];
  const fetch: Fetch = async (url, init) => {
    const u = new URL(url);
    appels.push({ url: u, init });
    return reponseJson(await repondre(u, init));
  };
  return { fetch, appels };
}

export const fetchParis = () => fauxFetch(() => jeuEssai('parisopendata.sample.json'));

export const fetchOpenAgenda = () => {
  const { pages } = jeuEssai<{ pages: unknown[] }>('openagenda.sample.json');
  return fauxFetch((url) => (url.searchParams.has('after[]') ? pages[1] : pages[0]));
};

export const fetchDataGouv = () =>
  fauxFetch((url) =>
    url.hostname === 'www.data.gouv.fr'
      ? { url: 'https://data.exemple.test/export.json' }
      : jeuEssai('datagouv.sample.json'),
  );

export const fetchEnPanne: Fetch = async () => {
  throw new TypeError('fetch failed (réseau coupé pour le test)');
};
