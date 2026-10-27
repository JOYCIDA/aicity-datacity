// Adaptateurs rejoués sur les fichiers d'essai de data/, sans réseau ni base.
import { describe, expect, it } from 'vitest';
import { categoriser } from '../../src/adapters/categories.js';
import { creerDataGouvAdapter } from '../../src/adapters/datagouv.adapter.js';
import { creerOpenAgendaAdapter } from '../../src/adapters/openagenda.adapter.js';
import { creerParisOpenDataAdapter } from '../../src/adapters/parisopendata.adapter.js';
import {
  coordonnees,
  type Fetch,
  prixMinimum,
  recupererJson,
  texteBrut,
} from '../../src/adapters/source.adapter.js';
import { fetchDataGouv, fetchOpenAgenda, fetchParis, jeuEssai, reponseJson } from '../helpers/faux-fetch.js';

describe('aides de normalisation', () => {
  it('écarte les coordonnées absentes, hors bornes ou à (0, 0)', () => {
    expect(coordonnees(48.85, 2.35)).toEqual({ latitude: 48.85, longitude: 2.35 });
    expect(coordonnees(0, 0)).toBeNull();
    expect(coordonnees(null, 2.35)).toBeNull();
    expect(coordonnees(95, 2)).toBeNull();
  });

  it('lit le plus petit prix des formats rencontrés dans les sources', () => {
    expect(prixMinimum('A partir de : 43.90 EUR')).toBe(43.9);
    expect(prixMinimum('7,50 € tarif plein 6 € tarif réduit')).toBe(6);
    expect(prixMinimum('Tarif plein 25 €, réduit 20 €')).toBe(20);
    expect(prixMinimum('Prix libre')).toBeNull();
  });

  it('réessaie les pannes passagères, pas les erreurs du client', async () => {
    let appels = 0;
    const instable: Fetch = async () => {
      if (++appels < 3) throw new TypeError('fetch failed', { cause: { code: 'UND_ERR_CONNECT_TIMEOUT' } });
      return reponseJson({ ok: true });
    };
    await expect(recupererJson(instable, 'https://exemple.test/a')).resolves.toEqual({ ok: true });
    expect(appels).toBe(3);

    let appels404 = 0;
    const introuvable: Fetch = async () => {
      appels404++;
      return new Response('{}', { status: 404 });
    };
    await expect(recupererJson(introuvable, 'https://exemple.test/b')).rejects.toThrow('HTTP 404 sur exemple.test/b');
    expect(appels404).toBe(1);

    const coupe: Fetch = async () => {
      throw new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } });
    };
    await expect(recupererJson(coupe, 'https://exemple.test/c')).rejects.toThrow('exemple.test/c injoignable (ECONNREFUSED)');
  });

  it('convertit le HTML en texte', () => {
    expect(texteBrut('<p>Entrée&nbsp;libre &amp; gratuite</p><p>l&#039;été</p>')).toBe('Entrée libre & gratuite\nl\'été');
  });

  it('range les mots-clés dans les six catégories', () => {
    expect(categoriser(['Concert', 'Festival'])).toBe('culture');
    expect(categoriser(['Atelier', 'Peinture'])).toBe('culture');
    expect(categoriser(['Enfants', 'Sport'])).toBe('sport');
    expect(categoriser(['Gourmand'])).toBe('gastronomie');
    expect(categoriser(['Brocante'])).toBe('shopping');
    expect(categoriser(['Vélo', 'réparation'])).toBe('sport');
    expect(categoriser(['transport'])).toBe('loisirs'); // « sport » doit commencer le mot
    expect(categoriser([], 'Balade dans le jardin des plantes')).toBe('nature');
  });
});

describe('Paris Open Data (réponse réelle)', () => {
  const brut = jeuEssai<any[]>('parisopendata.sample.json');

  it('interroge l’export filtré en une requête', async () => {
    const { fetch, appels } = fetchParis();
    const evenements = await creerParisOpenDataAdapter({ fetch }).recuperer();
    expect(evenements).toHaveLength(brut.length);
    expect(appels).toHaveLength(1);
    expect(appels[0]!.url.pathname).toMatch(/que-faire-a-paris-\/exports\/json$/);
    expect(appels[0]!.url.searchParams.get('where')).toContain('date_end >= now()');
  });

  it('normalise un événement complet', () => {
    const adapter = creerParisOpenDataAdapter();
    const e = brut.find((r) => r.id === '59868')!;
    expect(adapter.normaliser(e)).toMatchObject({
      idExterne: '59868',
      titre: expect.stringContaining('Dream Nation'),
      lieu: 'Parc des expo Paris Nord Villepinte',
      adresse: 'ZAC Paris Nord 2, 93420 Villepinte',
      latitude: expect.closeTo(48.963, 3),
      categorieCode: 'culture',
      gratuit: false,
      prix: 43.9,
      dureeMinutes: null, // deux jours : pas une durée de séance
      sourceUrl: expect.stringMatching(/^https:\/\/www\.paris\.fr\//),
    });
  });

  it('laisse vides les champs manquants pour que le service les rejette', () => {
    const adapter = creerParisOpenDataAdapter();
    const sansCoordonnees = adapter.normaliser(brut.find((r) => r.id === '107076')!);
    const ileNulle = adapter.normaliser(brut.find((r) => r.id === '11022')!);
    const sansDate = adapter.normaliser(brut.find((r) => r.id === '15396')!);
    expect(sansCoordonnees?.latitude).toBeNull();
    expect(ileNulle).toMatchObject({ latitude: null, debut: null });
    expect(sansDate?.debut).toBeNull();
  });
});

describe('OpenAgenda (jeu construit d’après la documentation)', () => {
  const adapter = (fetch = fetchOpenAgenda().fetch) =>
    creerOpenAgendaAdapter({ cle: 'cle-de-test', agendas: ['12345'], fetch });

  it('exige une clé et au moins un agenda', () => {
    expect(creerOpenAgendaAdapter({ agendas: ['1'] }).configurationManquante()).toMatch(/OPENAGENDA_API_KEY/);
    expect(creerOpenAgendaAdapter({ cle: 'x', agendas: [] }).configurationManquante()).toMatch(/AGENDAS/);
    expect(adapter().configurationManquante()).toBeNull();
  });

  it('suit la pagination `after` et passe la clé en en-tête, pas dans l’URL', async () => {
    const { fetch, appels } = fetchOpenAgenda();
    const evenements = await adapter(fetch).recuperer();
    expect(evenements).toHaveLength(5);
    expect(appels).toHaveLength(2);
    expect(appels[1]!.url.searchParams.getAll('after[]')).toEqual(['0', '000001893456000', '1893456000000', '78903']);
    expect(appels[0]!.url.searchParams.getAll('relative[]')).toEqual(['current', 'upcoming']);
    expect(appels[0]!.url.searchParams.has('key')).toBe(false);
    expect((appels[0]!.init!.headers as Record<string, string>).key).toBe('cle-de-test');
  });

  it('normalise, et écarte les événements annulés ou en ligne', async () => {
    const a = adapter();
    const [vin, expo, annule, enLigne, sansCoord] = (await a.recuperer()).map((e) => a.normaliser(e));
    expect(vin).toMatchObject({
      idExterne: '78901',
      categorieCode: 'gastronomie',
      prix: 20,
      gratuit: false,
      dureeMinutes: 120,
      photoUrl: 'https://cdn.openagenda.com/main/23fc5619015849848ffe4843c98a03e2.base.image.jpg',
      fin: new Date('2030-02-27T19:00:00.000Z'),
    });
    expect(expo).toMatchObject({ categorieCode: 'culture', gratuit: true, dureeMinutes: 480 });
    expect(annule).toBeNull();
    expect(enLigne).toBeNull();
    expect(sansCoord?.latitude).toBeNull();
  });
});

describe('data.gouv.fr (réponse réelle, GPSO)', () => {
  it('résout l’URL de la ressource sur data.gouv.fr puis la télécharge', async () => {
    const { fetch, appels } = fetchDataGouv();
    const a = creerDataGouvAdapter({ dataset: 'ds', ressource: 'rs', fetch });
    const evenements = await a.recuperer();
    expect(appels.map((x) => x.url.href)).toEqual([
      'https://www.data.gouv.fr/api/1/datasets/ds/resources/rs/',
      'https://data.exemple.test/export.json',
    ]);
    expect(evenements.length).toBe(jeuEssai<any[]>('datagouv.sample.json').length);

    const normalisees = evenements.map((e) => a.normaliser(e));
    const balade = normalisees.find((o) => o?.idExterne === '56006402');
    expect(balade).toMatchObject({
      titre: 'Balade thermique',
      lieu: 'Vanves',
      gratuit: true,
      dureeMinutes: 120,
      latitude: 48.821204,
      sourceUrl: 'https://openagenda.com/seineouest/events/balade-thermique-2865574',
    });
    // Les trois événements sans coordonnées du jeu réel sont des webinaires : hors périmètre.
    const sansCoordonnees = evenements.filter((e) => !e.location_coordinates);
    expect(sansCoordonnees).toHaveLength(3);
    expect(sansCoordonnees.map((e) => a.normaliser(e))).toEqual([null, null, null]);
  });
});
