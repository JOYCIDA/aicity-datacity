import { describe, expect, it } from 'vitest';
import { type Candidat, type Demande, evaluer, filtrer } from '../../src/services/filtre.service.js';

const MAINTENANT = new Date('2026-11-02T14:00:00Z');
const CENTRE = { latitude: 48.8566, longitude: 2.3522 }; // Hôtel de Ville
// ~400 m au nord du centre : 7 min à pied.
const PROCHE = { latitude: 48.8602, longitude: 2.3522 };

const offre = (o: Partial<Candidat> = {}): Candidat => ({
  id: 'o1',
  statut: 'VALIDE',
  categorie: { code: 'culture', libelleFr: 'Culture', libelleEn: 'Culture' },
  ...PROCHE,
  debut: new Date('2026-11-01T10:00:00Z'), // déjà en cours
  fin: new Date('2026-11-30T18:00:00Z'),
  dureeMinutes: 30,
  gratuit: false,
  prix: 8,
  creeLe: new Date('2026-10-01T00:00:00Z'),
  ...o,
});

const demande = (d: Partial<Demande> = {}): Demande => ({
  position: CENTRE,
  tempsLibreMinutes: 60,
  budgetMax: null,
  categories: [],
  maintenant: MAINTENANT,
  ...d,
});

const motif = (o: Candidat, d: Demande, rayon = 1000) => {
  const r = evaluer(o, d, rayon);
  return 'exclu' in r ? r.exclu : null;
};

describe('filtres de recommandation', () => {
  it('retient une offre qui satisfait tout, avec trajet, attente et marge', () => {
    const r = evaluer(offre(), demande(), 1000);
    expect('retenu' in r && r.retenu).toMatchObject({ distanceM: 400, trajetMinutes: 7, attenteMinutes: 0, margeMinutes: 23 });
  });

  it('RG4 : exclut toute offre non VALIDE', () => {
    for (const statut of ['EN_ATTENTE', 'REFUSE', 'EN_PAUSE', 'EXPIREE']) {
      expect(motif(offre({ statut }), demande())).toBe('statut');
    }
  });

  it('exclut hors du rayon (vol d’oiseau)', () => {
    expect(motif(offre(), demande(), 399)).toBe('rayon'); // l'offre est à 400,3 m
    expect(motif(offre(), demande(), 401)).toBeNull();
  });

  it('créneau : exclut si trajet + durée dépassent le temps libre', () => {
    expect(motif(offre({ dureeMinutes: 54 }), demande())).toBe('creneau'); // 7 + 54 = 61
    expect(motif(offre({ dureeMinutes: 53 }), demande())).toBeNull(); // 7 + 53 = 60
  });

  it('créneau : exclut une offre qui commence trop tard pour tenir dans le temps libre', () => {
    const plusTard = (minutes: number) => new Date(MAINTENANT.getTime() + minutes * 60_000);
    expect(motif(offre({ debut: plusTard(31) }), demande())).toBe('creneau'); // 31 + 30 = 61
    expect(motif(offre({ debut: plusTard(30) }), demande())).toBeNull();
  });

  it('créneau : exclut une offre qui ferme avant la fin de l’activité', () => {
    const fermeture = new Date(MAINTENANT.getTime() + 20 * 60_000); // 7 min de trajet + 30 min > 20
    expect(motif(offre({ fin: fermeture }), demande())).toBe('creneau');
  });

  it('RG11 : budget dépassé, ou prix inconnu avec un budget fixé', () => {
    expect(motif(offre({ prix: 12 }), demande({ budgetMax: 10 }))).toBe('budget');
    expect(motif(offre({ prix: null }), demande({ budgetMax: 10 }))).toBe('budget');
    expect(motif(offre({ prix: 10 }), demande({ budgetMax: 10 }))).toBeNull();
    expect(motif(offre({ prix: null }), demande({ budgetMax: null }))).toBeNull();
  });

  it('RG11 : budget 0 = gratuit uniquement', () => {
    expect(motif(offre({ prix: 1 }), demande({ budgetMax: 0 }))).toBe('budget');
    expect(motif(offre({ gratuit: true, prix: null }), demande({ budgetMax: 0 }))).toBeNull();
  });

  it('exclut les catégories non demandées ; aucune catégorie = toutes', () => {
    expect(motif(offre(), demande({ categories: ['sport', 'nature'] }))).toBe('categorie');
    expect(motif(offre(), demande({ categories: ['sport', 'culture'] }))).toBeNull();
    expect(motif(offre(), demande({ categories: [] }))).toBeNull();
  });

  it('filtrer ne garde que les offres retenues', () => {
    const offres = [offre({ id: 'a' }), offre({ id: 'b', statut: 'EN_ATTENTE' }), offre({ id: 'c', dureeMinutes: 120 })];
    expect(filtrer(offres, demande(), 1000).map((r) => r.offre.id)).toEqual(['a']);
  });
});
