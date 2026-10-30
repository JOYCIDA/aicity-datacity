import { categoriser } from '../../src/adapters/categories.js';
import { describe, expect, it } from 'vitest';
import { heuristiqueLocale } from '../../src/clients/llm.client.js';

const lire = (texte: string) => heuristiqueLocale.interpreter(texte);

describe('interprétation locale (sans LLM)', () => {
  it('« 2 h, gratuit, un musée »', async () => {
    expect(await lire('J’ai 2 h, quelque chose de gratuit, un musée')).toEqual({
      tempsLibreMinutes: 120,
      budgetMax: 0,
      categories: ['culture'],
    });
  });

  it.each([
    ['1h30 devant moi', 90],
    ['1 h 30 min', 90],
    ['45 minutes', 45],
    ['une heure et demie', 90],
    ['une demi-heure', 30],
    ['I have an hour', 60],
    ['1.5 hours', 90],
    ['10 min', 15], // borné au minimum accepté par la recommandation
  ])('durée : « %s » → %i min', async (texte, minutes) => {
    expect((await lire(texte)).tempsLibreMinutes).toBe(minutes);
  });

  it.each([
    ['moins de 15 €', 15],
    ['budget de 20', 20],
    ['10 euros max', 10],
    ['€25 tops', 25],
    ['something free', 0],
  ])('budget : « %s » → %d', async (texte, budget) => {
    expect((await lire(texte)).budgetMax).toBe(budget);
  });

  it('ne prend pas une durée pour un budget, et laisse absent ce qui n’est pas dit', async () => {
    expect(await lire('2 h dans un parc')).toEqual({ tempsLibreMinutes: 120, categories: ['nature'] });
    expect(await lire('bonjour')).toEqual({ categories: [] });
  });

  it('repère plusieurs catégories, en français comme en anglais', async () => {
    expect((await lire('un resto puis du shopping')).categories).toEqual(['gastronomie', 'shopping']);
    expect((await lire('a museum then a walk in the park')).categories).toEqual(['nature', 'culture']);
    expect((await lire('dégustation de vins et concert')).categories).toEqual(['gastronomie', 'culture']);
  });

  it('comprend le langage courant : manger, resto, café, balade, vélo', async () => {
    expect((await lire('manger un bon resto')).categories).toEqual(['gastronomie']);
    expect((await lire('envie de manger un morceau')).categories).toEqual(['gastronomie']);
    expect((await lire('un café au calme')).categories).toEqual(['gastronomie']);
    expect((await lire('vélo au parc')).categories).toEqual(['sport', 'nature']);
    expect((await lire('une balade au bord du canal')).categories).toEqual(['nature']);
    expect((await lire('pique-nique et bowling')).categories).toEqual(['nature', 'loisirs']);
    expect((await lire('I want to eat something and drink a coffee')).categories).toEqual(['gastronomie']);
  });

  it('ne classe pas pour autant un événement « café-théâtre » en gastronomie à l’import', () => {
    expect(categoriser(['Café-théâtre'], null)).toBe('culture');
    expect(categoriser([], 'Café-concert du dimanche')).toBe('culture');
  });
});
