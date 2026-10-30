import { describe, expect, it, vi } from 'vitest';
import { creerParisOpenDataAdapter } from '../../src/adapters/parisopendata.adapter.js';
import { creerTraducteurDeepL } from '../../src/clients/traduction.client.js';
import { offrePubliqueDto } from '../../src/utils/dto.js';
import { jeuEssai } from '../helpers/faux-fetch.js';

describe('Paris Open Data : crédit et description de la photo', () => {
  const adapter = creerParisOpenDataAdapter();
  const brut = jeuEssai<any[]>('parisopendata.sample.json')[0];

  it('importe cover_credit et cover_alt', () => {
    const o = adapter.normaliser({ ...brut, cover_credit: '© Ville de Paris / Jean Dupont', cover_alt: '  Foule devant la scène  ' });
    expect(o).toMatchObject({ photoCredit: '© Ville de Paris / Jean Dupont', photoAlt: 'Foule devant la scène' });
  });

  it('les met à null quand la source ne les donne pas', () => {
    const o = adapter.normaliser({ ...brut, cover_credit: undefined, cover_alt: '' });
    expect(o).toMatchObject({ photoCredit: null, photoAlt: null });
  });
});

describe('client DeepL', () => {
  const reponse = (textes: string[]) =>
    new Response(JSON.stringify({ translations: textes.map((t) => ({ text: `EN ${t}` })) }), { status: 200 });

  it('envoie les textes dans le bon format, avec l’URL gratuite pour une clé « :fx »', async () => {
    const fetch = vi.fn(async (_url: string, init?: RequestInit) => reponse(JSON.parse(init!.body as string).text));
    const r = await creerTraducteurDeepL({ cle: 'abc:fx', fetch }).traduire(['Bonjour', 'Exposition']);
    expect(r).toEqual(['EN Bonjour', 'EN Exposition']);
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe('https://api-free.deepl.com/v2/translate');
    expect(init!.method).toBe('POST');
    expect((init!.headers as Record<string, string>).Authorization).toBe('DeepL-Auth-Key abc:fx');
    expect(JSON.parse(init!.body as string)).toEqual({ text: ['Bonjour', 'Exposition'], source_lang: 'FR', target_lang: 'EN-GB' });
  });

  it('utilise l’URL payante sans « :fx » et découpe par lots de 40 textes', async () => {
    const fetch = vi.fn(async (_url: string, init?: RequestInit) => reponse(JSON.parse(init!.body as string).text));
    const textes = Array.from({ length: 85 }, (_, i) => `t${i}`);
    const r = await creerTraducteurDeepL({ cle: 'cle-payante', fetch }).traduire(textes);
    expect(r).toHaveLength(85);
    expect(r[84]).toBe('EN t84');
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch.mock.calls[0]![0]).toBe('https://api.deepl.com/v2/translate');
  });

  it('lève une erreur claire si le quota est épuisé ou si la réponse est incohérente', async () => {
    const quota = vi.fn(async () => new Response('', { status: 456 }));
    await expect(creerTraducteurDeepL({ cle: 'x:fx', fetch: quota }).traduire(['a'])).rejects.toThrow('HTTP 456');
    const trop = vi.fn(async () => reponse(['a', 'b']));
    await expect(creerTraducteurDeepL({ cle: 'x:fx', fetch: trop }).traduire(['a'])).rejects.toThrow('inattendue');
  });
});

describe('offrePubliqueDto : langue du contenu', () => {
  const base: any = {
    id: 'o1', titre: 'Exposition photo', description: 'Une expo', lieu: 'Galerie', adresse: 'rue A', latitude: 1, longitude: 2,
    debut: new Date(), fin: null, horaires: null, dureeMinutes: 20, prix: null, gratuit: true, photoUrl: null,
    photoCredit: null, photoAlt: null, titreEn: null, descriptionEn: null, lieuEn: null, source: 'PARIS_OPEN_DATA',
    sourceUrl: null, statut: 'VALIDE', motifRefus: null, creeLe: new Date(), majLe: new Date(),
    categorie: { code: 'culture', libelleFr: 'Culture', libelleEn: 'Culture', picto: null }, entreprise: null,
  };

  it('français par défaut, sans exposer les champs anglais bruts', () => {
    const o = offrePubliqueDto({ ...base, titreEn: 'Photo exhibition' });
    expect(o).toMatchObject({ titre: 'Exposition photo', langue: 'FR', traduit: true });
    expect(o).not.toHaveProperty('titreEn');
  });

  it('anglais quand il existe, avec `traduit` vrai', () => {
    const o = offrePubliqueDto({ ...base, titreEn: 'Photo exhibition', descriptionEn: 'An expo', lieuEn: 'Gallery' }, 'EN');
    expect(o).toMatchObject({ titre: 'Photo exhibition', description: 'An expo', lieu: 'Gallery', langue: 'EN', traduit: true });
  });

  it('repli sur le français champ par champ, avec `traduit` faux', () => {
    const o = offrePubliqueDto({ ...base, titreEn: 'Photo exhibition' }, 'EN');
    expect(o).toMatchObject({ titre: 'Photo exhibition', description: 'Une expo', lieu: 'Galerie', traduit: false });
    expect(offrePubliqueDto(base, 'EN')).toMatchObject({ titre: 'Exposition photo', traduit: false });
  });

  it('une offre sans description n’a pas besoin de traduction de description', () => {
    const o = offrePubliqueDto({ ...base, description: null, titreEn: 'X', lieuEn: 'Y' }, 'EN');
    expect(o).toMatchObject({ description: null, traduit: true });
  });
});
