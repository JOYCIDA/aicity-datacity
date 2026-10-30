import { describe, expect, it } from 'vitest';
import { ecarterCoordonneesDouteuses, POINT_PAR_DEFAUT_PARIS } from '../../src/adapters/qualite.js';

const o = (adresse: string, latitude: number, longitude: number, lieu = 'Lieu') => ({ adresse, lieu, latitude, longitude });
const PAR_DEFAUT = POINT_PAR_DEFAUT_PARIS;

describe('coordonnées douteuses à l’import', () => {
  it('garde des coordonnées ordinaires', () => {
    const offres = [o('12 rue A, 75011 Paris', 48.86, 2.38), o('3 rue B, 75012 Paris', 48.84, 2.39)];
    expect(ecarterCoordonneesDouteuses(offres).ecartees).toEqual([]);
  });

  it('écarte une offre posée sur le point par défaut de Paris quand l’adresse ne le confirme pas', () => {
    const forum = o('Westfield Forum des Halles, 2 Rue du cinéma, 75001 Paris', PAR_DEFAUT.latitude, PAR_DEFAUT.longitude, 'Forum des images');
    const bon = o('12 rue A, 75011 Paris', 48.86, 2.38);
    const r = ecarterCoordonneesDouteuses([forum, bon]);
    expect(r.ecartees).toEqual([forum]);
    expect(r.gardees).toEqual([bon]);
  });

  it('garde une offre sur ce point si l’adresse est celle de l’Hôtel de Ville ou de la rue de Rivoli', () => {
    const rivoli = o('38, rue de Rivoli, 75004 Paris', PAR_DEFAUT.latitude, PAR_DEFAUT.longitude, '38Riv Jazz Club');
    const mairie = o('Parvis de l’Hôtel de Ville, 75004 Paris', PAR_DEFAUT.latitude + 0.00001, PAR_DEFAUT.longitude);
    expect(ecarterCoordonneesDouteuses([rivoli, mairie]).ecartees).toEqual([]);
  });

  it('écarte un point partagé par trois adresses différentes ou plus, sans adresse dominante', () => {
    const point = { latitude: 48.9, longitude: 2.4 };
    const offres = [
      o('1 rue A, 75018 Paris', point.latitude, point.longitude),
      o('2 rue B, 75018 Paris', point.latitude, point.longitude),
      o('3 rue C, 75018 Paris', point.latitude, point.longitude),
    ];
    expect(ecarterCoordonneesDouteuses(offres).gardees).toEqual([]);
  });

  it('garde l’adresse dominante d’un point partagé (un lieu, variantes d’écriture comprises)', () => {
    const point = { latitude: 48.9, longitude: 2.4 };
    const salle = [1, 2, 3, 4].map(() => o('10 rue du Théâtre, 75015 Paris', point.latitude, point.longitude));
    const autres = [o('1 rue A, 75015 Paris', point.latitude, point.longitude), o('2 rue B, 75015 Paris', point.latitude, point.longitude)];
    const r = ecarterCoordonneesDouteuses([...salle, ...autres]);
    expect(r.gardees).toEqual(salle);
    expect(r.ecartees).toEqual(autres);
  });

  it('ne touche pas à deux adresses sur un même point (venue et sa variante d’écriture)', () => {
    const offres = [
      o('211 avenue Jean Jaurès, 75019 Paris', 48.894, 2.389),
      o('Grande Halle de la Villette, 75019 Paris', 48.894, 2.389),
    ];
    expect(ecarterCoordonneesDouteuses(offres).ecartees).toEqual([]);
  });
});
