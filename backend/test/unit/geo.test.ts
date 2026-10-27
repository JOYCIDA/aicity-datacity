import { describe, expect, it } from 'vitest';
import { boiteEnglobante, distanceMetres, minutesAPied } from '../../src/utils/geo.js';

const NOTRE_DAME = { latitude: 48.852968, longitude: 2.349902 };
const TOUR_EIFFEL = { latitude: 48.85837, longitude: 2.294481 };

describe('géographie', () => {
  it('Notre-Dame → tour Eiffel : environ 4,1 km à vol d’oiseau', () => {
    expect(distanceMetres(NOTRE_DAME, TOUR_EIFFEL)).toBeCloseTo(4099, -1); // à 10 m près
    expect(distanceMetres(NOTRE_DAME, NOTRE_DAME)).toBe(0);
    expect(distanceMetres(TOUR_EIFFEL, NOTRE_DAME)).toBeCloseTo(distanceMetres(NOTRE_DAME, TOUR_EIFFEL), 6);
  });

  it('RG14 : trajet à pied = distance × 1,3 à 5 km/h, arrondi à la minute supérieure', () => {
    expect(minutesAPied(1000)).toBe(16); // 1 300 m ÷ 83,3 m/min = 15,6
    expect(minutesAPied(4099)).toBe(64);
    expect(minutesAPied(0)).toBe(0);
  });

  it('la boîte englobante contient le cercle et reste proche de lui', () => {
    const rayon = 1500;
    const b = boiteEnglobante(NOTRE_DAME, rayon);
    const coins = [
      { latitude: b.latMax, longitude: NOTRE_DAME.longitude },
      { latitude: b.latMin, longitude: NOTRE_DAME.longitude },
      { latitude: NOTRE_DAME.latitude, longitude: b.lonMax },
      { latitude: NOTRE_DAME.latitude, longitude: b.lonMin },
    ];
    for (const c of coins) expect(distanceMetres(NOTRE_DAME, c)).toBeCloseTo(rayon, -1);
    // La tour Eiffel (4,1 km) est hors d'une boîte de 1,5 km.
    expect(TOUR_EIFFEL.longitude).toBeLessThan(b.lonMin);
  });
});
