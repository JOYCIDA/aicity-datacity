// UC11 sur la base aicity_test : deux entreprises, des compteurs anonymes (StatOffreJour) ;
// chacune ne voit que les siens, regroupés par statut, catégorie, créneau et budget (RG19).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { baseDisponible, preparerBase, prismaTest } from '../helpers/base-reelle.js';

vi.mock('../../src/prisma/client.js', () => ({ prisma: prismaTest }));

const { createApp } = await import('../../src/app.js');
const { signerToken } = await import('../../src/utils/jwt.js');

const app = createApp();
// 10 novembre 2026, 13 h à Paris (UTC+1) : les heures de début ci-dessous sont en UTC.
const MAINTENANT = new Date('2026-11-10T12:00:00.000Z');
const jour = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

async function entreprise(nom: string) {
  const u = await prismaTest.utilisateur.create({
    data: {
      email: `${nom.toLowerCase()}@aicity.test`,
      motDePasseHash: 'x',
      role: 'ENTREPRISE',
      entreprise: { create: { nom, typeActivite: 'Commerce', adresse: '1 rue de Paris', statut: 'ACTIF' } },
    },
    select: { id: true, entreprise: { select: { id: true } } },
  });
  return { utilisateurId: u.id, id: u.entreprise!.id };
}

describe.skipIf(!baseDisponible)('statistiques d’une entreprise (UC11, RG19)', () => {
  let a: Awaited<ReturnType<typeof entreprise>>;
  let b: Awaited<ReturnType<typeof entreprise>>;

  beforeAll(async () => {
    await preparerBase();
    const [culture, gastronomie] = await Promise.all(
      ['culture', 'gastronomie', 'nature'].map((code) =>
        prismaTest.categorie.create({ data: { code, libelleFr: code, libelleEn: code } }),
      ),
    );
    a = await entreprise('Alpha');
    b = await entreprise('Beta');

    const offre = async (
      entrepriseId: string,
      titre: string,
      champs: { statut: 'VALIDE' | 'EN_ATTENTE' | 'REFUSE'; categorieId: string; debut: string; prix: number | null },
    ) =>
      (
        await prismaTest.offre.create({
          data: {
            entrepriseId,
            titre,
            lieu: 'Paris',
            latitude: 48.85,
            longitude: 2.35,
            dureeMinutes: 60,
            statut: champs.statut,
            categorieId: champs.categorieId,
            debut: new Date(champs.debut),
            prix: champs.prix,
            gratuit: champs.prix === null,
          },
        })
      ).id;

    // Alpha : quatre offres, de quoi remplir chaque regroupement.
    const matinGratuit = await offre(a.id, 'Visite du matin', {
      statut: 'VALIDE', categorieId: culture!.id, debut: '2026-11-12T08:00:00Z', prix: null, // 9 h
    });
    const apresMidi = await offre(a.id, 'Atelier pâtisserie', {
      statut: 'VALIDE', categorieId: gastronomie!.id, debut: '2026-11-12T13:00:00Z', prix: 15, // 14 h
    });
    await offre(a.id, 'Dîner dégustation', {
      statut: 'EN_ATTENTE', categorieId: gastronomie!.id, debut: '2026-11-12T19:00:00Z', prix: 60, // 20 h
    });
    await offre(a.id, 'Conférence', {
      statut: 'REFUSE', categorieId: culture!.id, debut: '2026-11-12T10:59:00Z', prix: 10, // 11 h 59
    });
    // Beta : une offre très consultée, qui ne doit jamais apparaître chez Alpha.
    const concurrente = await offre(b.id, 'Offre de Beta', {
      statut: 'VALIDE', categorieId: culture!.id, debut: '2026-11-12T19:00:00Z', prix: 5,
    });

    await prismaTest.statOffreJour.createMany({
      data: [
        { offreId: matinGratuit, jour: jour('2026-11-10'), vues: 5, recommandations: 2, favoris: 1 },
        { offreId: matinGratuit, jour: jour('2026-11-01'), vues: 3 },
        { offreId: matinGratuit, jour: jour('2026-09-01'), vues: 100 }, // hors des 30 derniers jours
        { offreId: apresMidi, jour: jour('2026-11-09'), vues: 4, recommandations: 1 },
        { offreId: concurrente, jour: jour('2026-11-10'), vues: 1000, recommandations: 500, favoris: 50 },
      ],
    });
  }, 60_000);

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(MAINTENANT);
  });
  afterEach(() => vi.useRealTimers());
  afterAll(() => prismaTest.$disconnect());

  // Jeton signé à l'heure figée, pour qu'il soit valide à MAINTENANT.
  const jeton = (e: { utilisateurId: string }) => `Bearer ${signerToken({ id: e.utilisateurId, role: 'ENTREPRISE' })}`;
  const statistiques = (auth: string, query = '') =>
    request(app).get(`/api/entreprise/statistiques${query}`).set('Authorization', auth);

  it('compte par statut, catégorie, créneau et budget, sur les 30 derniers jours', async () => {
    const res = await statistiques(jeton(a));
    expect(res.status).toBe(200);
    const zero = { vues: 0, recommandations: 0, favoris: 0 };
    expect(res.body).toEqual({
      periode: { du: '2026-10-12', au: '2026-11-10', jours: 30 },
      totaux: { offres: 4, vues: 12, recommandations: 3, favoris: 1 },
      parStatut: [
        { statut: 'EN_ATTENTE', offres: 1, ...zero },
        { statut: 'VALIDE', offres: 2, vues: 12, recommandations: 3, favoris: 1 },
        { statut: 'REFUSE', offres: 1, ...zero },
        { statut: 'EN_PAUSE', offres: 0, ...zero },
        { statut: 'EXPIREE', offres: 0, ...zero },
      ],
      parCategorie: [
        { categorie: 'culture', offres: 2, vues: 8, recommandations: 2, favoris: 1 },
        { categorie: 'gastronomie', offres: 2, vues: 4, recommandations: 1, favoris: 0 },
        { categorie: 'nature', offres: 0, ...zero },
      ],
      parCreneau: [
        { creneau: 'MATIN', offres: 2, vues: 8, recommandations: 2, favoris: 1 },
        { creneau: 'APRES_MIDI', offres: 1, vues: 4, recommandations: 1, favoris: 0 },
        { creneau: 'SOIREE', offres: 1, ...zero },
      ],
      parBudget: [
        { tranche: 'GRATUIT', offres: 1, vues: 8, recommandations: 2, favoris: 1 },
        { tranche: 'JUSQU_A_10', offres: 1, ...zero },
        { tranche: 'JUSQU_A_20', offres: 1, vues: 4, recommandations: 1, favoris: 0 },
        { tranche: 'JUSQU_A_50', offres: 0, ...zero },
        { tranche: 'PLUS_DE_50', offres: 1, ...zero },
      ],
      parJour: [
        { jour: '2026-11-01', vues: 3, recommandations: 0, favoris: 0 },
        { jour: '2026-11-09', vues: 4, recommandations: 1, favoris: 0 },
        { jour: '2026-11-10', vues: 5, recommandations: 2, favoris: 1 },
      ],
    });
  });

  it('ne montre que les offres de l’entreprise, et aucune donnée individuelle', async () => {
    const alpha = await statistiques(jeton(a));
    const texte = JSON.stringify(alpha.body);
    expect(texte).not.toContain('1000');
    expect(texte).not.toMatch(/Beta|Visite|@|utilisateur|email|"id"/i);

    const beta = await statistiques(jeton(b));
    expect(beta.body.totaux).toEqual({ offres: 1, vues: 1000, recommandations: 500, favoris: 50 });
    expect(beta.body.parJour).toEqual([{ jour: '2026-11-10', vues: 1000, recommandations: 500, favoris: 50 }]);
  });

  it('la période se règle avec ?jours= (1 à 365)', async () => {
    const semaine = await statistiques(jeton(a), '?jours=7');
    expect(semaine.body.periode).toEqual({ du: '2026-11-04', au: '2026-11-10', jours: 7 });
    expect(semaine.body.totaux).toEqual({ offres: 4, vues: 9, recommandations: 3, favoris: 1 });

    const annee = await statistiques(jeton(a), '?jours=365');
    expect(annee.body.totaux.vues).toBe(112);

    expect((await statistiques(jeton(a), '?jours=0')).status).toBe(422);
    expect((await statistiques(jeton(a), '?jours=366')).status).toBe(422);
  });

  it('réservé aux comptes entreprise', async () => {
    const citoyen = `Bearer ${signerToken({ id: 'c', role: 'CITOYEN' })}`;
    expect((await statistiques(citoyen)).status).toBe(403);
    expect((await request(app).get('/api/entreprise/statistiques')).status).toBe(401);
  });
});
