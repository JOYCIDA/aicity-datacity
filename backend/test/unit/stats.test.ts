import { describe, expect, it } from 'vitest';
import { creneau, jourParis, trancheBudget } from '../../src/services/stats.service.js';

describe('créneau de début, à l’heure de Paris', () => {
  it('bascule à 12 h et à 18 h, heure d’hiver comme heure d’été', () => {
    expect(creneau(new Date('2026-01-15T10:59:00Z'))).toBe('MATIN'); // 11 h 59 (UTC+1)
    expect(creneau(new Date('2026-01-15T11:00:00Z'))).toBe('APRES_MIDI'); // 12 h
    expect(creneau(new Date('2026-07-15T09:59:00Z'))).toBe('MATIN'); // 11 h 59 (UTC+2)
    expect(creneau(new Date('2026-07-15T15:59:00Z'))).toBe('APRES_MIDI'); // 17 h 59
    expect(creneau(new Date('2026-07-15T16:00:00Z'))).toBe('SOIREE'); // 18 h
    expect(creneau(new Date('2026-07-15T22:30:00Z'))).toBe('MATIN'); // 0 h 30 le lendemain
  });
});

describe('tranche de budget', () => {
  it('reprend les paliers de la question « budget »', () => {
    expect(trancheBudget({ gratuit: true, prix: null })).toBe('GRATUIT');
    expect(trancheBudget({ gratuit: false, prix: 0 })).toBe('GRATUIT');
    expect(trancheBudget({ gratuit: false, prix: 10 })).toBe('JUSQU_A_10');
    expect(trancheBudget({ gratuit: false, prix: 10.01 })).toBe('JUSQU_A_20');
    expect(trancheBudget({ gratuit: false, prix: 50 })).toBe('JUSQU_A_50');
    expect(trancheBudget({ gratuit: false, prix: 50.5 })).toBe('PLUS_DE_50');
  });
});

describe('jour civil à Paris', () => {
  it('23 h 30 UTC le 31 décembre est déjà le 1er janvier à Paris', () => {
    expect(jourParis(new Date('2026-12-31T23:30:00Z')).toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });
});
