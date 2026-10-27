import { describe, expect, it } from 'vitest';
import { BAREME, SCORE_MAX } from '../../src/config/scoring.js';
import type { Candidat, CandidatEvalue } from '../../src/services/filtre.service.js';
import { classer, expliquer, noter } from '../../src/services/scoring.service.js';

const evalue = (o: Partial<Candidat> = {}, e: Partial<Omit<CandidatEvalue, 'offre'>> = {}): CandidatEvalue => ({
  offre: {
    id: 'o1',
    statut: 'VALIDE',
    categorie: { code: 'culture', libelleFr: 'Culture', libelleEn: 'Culture' },
    latitude: 48.86,
    longitude: 2.35,
    debut: new Date('2026-11-01T10:00:00Z'),
    fin: null,
    dureeMinutes: 30,
    gratuit: false,
    prix: 15,
    creeLe: new Date('2026-10-01T00:00:00Z'),
    ...o,
  },
  distanceM: 400,
  trajetMinutes: 7,
  attenteMinutes: 0,
  margeMinutes: 23,
  ...e,
});

const ctx = { budgetMax: 20, categoriesPreferees: ['culture'] };

describe('barème', () => {
  it('le maximum vaut 9 points', () => {
    expect(SCORE_MAX).toBe(9);
    const parfait = noter(evalue({ gratuit: true, prix: null }), ctx);
    expect(parfait.score).toBe(9);
    expect(parfait.criteres.map((c) => c.critere)).toEqual(['categorie', 'proximite', 'gratuit', 'imminent', 'marge']);
  });

  it('catégorie : 3 points si elle fait partie des envies', () => {
    expect(noter(evalue(), ctx).criteres).toContainEqual({ critere: 'categorie', points: 3 });
    expect(noter(evalue(), { ...ctx, categoriesPreferees: ['sport'] }).criteres.some((c) => c.critere === 'categorie')).toBe(false);
  });

  it('proximité : 2 points jusqu’à 10 min, 1 point jusqu’à 20 min, 0 au-delà', () => {
    const points = (trajetMinutes: number) =>
      noter(evalue({}, { trajetMinutes }), ctx).criteres.find((c) => c.critere === 'proximite')?.points ?? 0;
    expect([points(10), points(11), points(20), points(21)]).toEqual([2, 1, 1, 0]);
  });

  it('prix : 2 points si gratuit, 1 point jusqu’à la moitié du budget', () => {
    const prix = (o: Partial<Candidat>, budgetMax: number | null = 20) =>
      noter(evalue(o), { ...ctx, budgetMax }).criteres.filter((c) => ['gratuit', 'prixBas'].includes(c.critere));
    expect(prix({ gratuit: true })).toEqual([{ critere: 'gratuit', points: 2 }]);
    expect(prix({ prix: 10 })).toEqual([{ critere: 'prixBas', points: 1 }]);
    expect(prix({ prix: 10.01 })).toEqual([]);
    expect(prix({ prix: 1 }, null)).toEqual([]); // sans budget, pas de référence
  });

  it('imminence et marge : 1 point chacun selon les seuils', () => {
    const a = (e: Partial<CandidatEvalue>) => noter(evalue({}, e), ctx).criteres.map((c) => c.critere);
    expect(a({ attenteMinutes: BAREME.imminence.dansMinutes })).toContain('imminent');
    expect(a({ attenteMinutes: BAREME.imminence.dansMinutes + 1 })).not.toContain('imminent');
    expect(a({ margeMinutes: 15 })).toContain('marge');
    expect(a({ margeMinutes: 14 })).not.toContain('marge');
  });
});

describe('classement (RG13)', () => {
  it('trie par score, puis fraîcheur, puis distance, et garde les n premiers', () => {
    const recent = new Date('2026-10-20T00:00:00Z');
    const ancien = new Date('2026-09-01T00:00:00Z');
    const resultat = classer(
      [
        evalue({ id: 'score-bas', categorie: { code: 'sport', libelleFr: 'Sport', libelleEn: 'Sport' } }),
        evalue({ id: 'ancien-proche', creeLe: ancien }, { distanceM: 100 }),
        evalue({ id: 'recent-loin', creeLe: recent }, { distanceM: 900 }),
        evalue({ id: 'recent-proche', creeLe: recent }, { distanceM: 300 }),
        evalue({ id: 'meilleur', gratuit: true }),
      ],
      ctx,
      4,
    );
    expect(resultat.map((r) => r.offre.id)).toEqual(['meilleur', 'recent-proche', 'recent-loin', 'ancien-proche']);
    expect(resultat.map((r) => r.rang)).toEqual([1, 2, 3, 4]);
  });
});

describe('explication', () => {
  it('justifie la note en français et en anglais', () => {
    const c = { ...evalue({ prix: 8 }, { attenteMinutes: 12 }), ...noter(evalue({ prix: 8 }, { attenteMinutes: 12 }), ctx) };
    expect(expliquer(c, 'FR')).toBe(
      'Dans vos envies (culture) · à 7 min à pied · petit prix (8 €) · commence 12 min après votre arrivée · il vous restera 23 min',
    );
    expect(expliquer(c, 'EN')).toBe(
      'Matches your interests (culture) · 7 min walk · low price (€8) · starts 12 min after you arrive · 23 min to spare',
    );
  });

  it('mentionne toujours le trajet, même sans point de proximité', () => {
    const loin = evalue({}, { trajetMinutes: 25, margeMinutes: 5 });
    const c = { ...loin, ...noter(loin, { budgetMax: null, categoriesPreferees: [] }) };
    expect(expliquer(c, 'FR')).toBe('À 25 min à pied · accessible dès votre arrivée');
  });
});
