// UC2 / UC8 sur la base aicity_test : préfiltre SQL, élargissement (RG12), enregistrement.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { baseDisponible, preparerBase, prismaTest } from '../helpers/base-reelle.js';

vi.mock('../../src/prisma/client.js', () => ({ prisma: prismaTest }));

const { createApp } = await import('../../src/app.js');
const { signerToken } = await import('../../src/utils/jwt.js');

const app = createApp();
const CENTRE = { latitude: 48.8566, longitude: 2.3522 }; // Hôtel de Ville
const METRES_PAR_DEGRE_LAT = 111_195;
const auNord = (metres: number) => ({
  latitude: CENTRE.latitude + metres / METRES_PAR_DEGRE_LAT,
  longitude: CENTRE.longitude,
});

let citoyen: string;
let idCulture: string;
let idSport: string;

async function creerOffre(titre: string, metres: number, o: Record<string, unknown> = {}) {
  const offre = await prismaTest.offre.create({
    data: {
      titre,
      lieu: `Lieu ${titre}`,
      ...auNord(metres),
      debut: new Date(Date.now() - 24 * 3600_000), // en cours depuis hier
      fin: new Date(Date.now() + 30 * 24 * 3600_000),
      dureeMinutes: 20,
      gratuit: true,
      statut: 'VALIDE',
      source: 'PARIS_OPEN_DATA',
      idExterne: titre,
      categorieId: idCulture,
      ...o,
    },
  });
  return offre.id;
}

const recommander = (corps: Record<string, unknown>, jeton = citoyen) =>
  request(app)
    .post('/api/citoyen/recommandations')
    .set('Authorization', `Bearer ${jeton}`)
    .send({ ...CENTRE, tempsLibreMinutes: 60, ...corps });

describe.skipIf(!baseDisponible)('recommandation (UC2) et fiche (UC8)', () => {
  beforeAll(async () => {
    await preparerBase();
    idCulture = (await prismaTest.categorie.create({ data: { code: 'culture', libelleFr: 'Culture', libelleEn: 'Culture' } })).id;
    idSport = (await prismaTest.categorie.create({ data: { code: 'sport', libelleFr: 'Sport', libelleEn: 'Sport' } })).id;
    const u = await prismaTest.utilisateur.create({
      data: { email: 'citoyen@aicity.test', motDePasseHash: 'x', role: 'CITOYEN' },
    });
    citoyen = signerToken({ id: u.id, role: 'CITOYEN' });
  }, 60_000);

  beforeEach(async () => {
    await prismaTest.$executeRawUnsafe('TRUNCATE "Recherche", "Offre" CASCADE');
  });

  afterAll(() => prismaTest.$disconnect());

  it('60 min autour d’un point de Paris : au plus 5 résultats, triés, sans élargissement', async () => {
    // creeLe explicite : à score égal, la plus récente passe devant la plus proche (RG13).
    for (const [i, m] of [100, 200, 300, 400, 500, 600, 700].entries()) {
      await creerOffre(`proche-${i}`, m, { creeLe: new Date(Date.UTC(2026, 9, 1 + i)) });
    }
    await creerOffre('payante', 150, { gratuit: false, prix: 30 }); // moins bien notée
    await creerOffre('trop-loin', 5000);

    const t = Date.now();
    const res = await recommander({});
    const duree = Date.now() - t;

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ elargie: false, rayonM: 1000 });
    expect(res.body.resultats).toHaveLength(5);
    const scores = res.body.resultats.map((r: { score: number }) => r.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(res.body.resultats.map((r: { rang: number }) => r.rang)).toEqual([1, 2, 3, 4, 5]);
    // Sans catégorie ni préférence, pas de points « envies » : 100 à 600 m (≤ 10 min) valent
    // 6 points, 700 m (11 min) en vaut 5 ; les ex æquo sont départagés par fraîcheur.
    expect(res.body.resultats.map((r: { offre: { titre: string } }) => r.offre.titre)).toEqual([
      'proche-5', 'proche-4', 'proche-3', 'proche-2', 'proche-1',
    ]);
    expect(res.body.resultats[0]).toMatchObject({ score: 6, scoreMax: 9, trajetMinutes: 10, distanceM: 600 });
    expect(res.body.resultats[0].explication).toBe(
      'À 10 min à pied · gratuit · accessible dès votre arrivée · il vous restera 30 min',
    );
    expect(res.body.resultats[0].offre).not.toHaveProperty('statut');
    expect(res.body.resultats.map((r: { offre: { titre: string } }) => r.offre.titre)).not.toContain('payante');
    expect(duree).toBeLessThan(1500); // ENF-01
  });

  it('RG12 : moins de 3 offres → rayon doublé une seule fois, elargie = true', async () => {
    await creerOffre('dans-1km', 800);
    await creerOffre('entre-1-et-2km-a', 1500);
    await creerOffre('entre-1-et-2km-b', 1900);
    await creerOffre('au-dela-2km', 2300);

    const res = await recommander({ tempsLibreMinutes: 120 });
    expect(res.body).toMatchObject({ elargie: true, rayonM: 2000 });
    expect(res.body.resultats.map((r: { offre: { titre: string } }) => r.offre.titre).sort()).toEqual([
      'dans-1km',
      'entre-1-et-2km-a',
      'entre-1-et-2km-b',
    ]);
  });

  it('une offre EN_ATTENTE (ou en pause) n’apparaît jamais, même parfaite et à 50 m', async () => {
    const enAttente = await creerOffre('en-attente', 50, { statut: 'EN_ATTENTE', source: 'ENTREPRISE', idExterne: null });
    await creerOffre('en-pause', 60, { statut: 'EN_PAUSE' });
    await creerOffre('validee', 900);

    const res = await recommander({});
    const ids = res.body.resultats.map((r: { offre: { id: string } }) => r.offre.id);
    expect(ids).not.toContain(enAttente);
    expect(res.body.resultats.map((r: { offre: { titre: string } }) => r.offre.titre)).toEqual(['validee']);
    expect(res.body.elargie).toBe(true);
  });

  it('applique budget et catégories, et explique en anglais sur demande', async () => {
    await creerOffre('culture-gratuite', 200);
    await creerOffre('sport-8e', 300, { categorieId: idSport, gratuit: false, prix: 8 });
    await creerOffre('sport-25e', 300, { categorieId: idSport, gratuit: false, prix: 25 });

    const res = await recommander({ categories: ['sport'], budgetMax: 20, langue: 'EN' });
    expect(res.body.resultats.map((r: { offre: { titre: string } }) => r.offre.titre)).toEqual(['sport-8e']);
    expect(res.body.resultats[0].explication).toMatch(/^Matches your interests \(sport\) · 5 min walk · low price \(€8\)/);
  });

  it('enregistre la recherche et les recommandations, jamais la position', async () => {
    await creerOffre('a', 100);
    const res = await recommander({});
    const recherche = await prismaTest.recherche.findUniqueOrThrow({
      where: { id: res.body.rechercheId },
      include: { recommandations: true },
    });
    expect(recherche).toMatchObject({ tempsLibreMinutes: 60, rayonM: 2000, elargie: true, sessionId: null });
    expect(recherche.recommandations).toHaveLength(1);
    expect(recherche.recommandations[0]).toMatchObject({ rang: 1, score: res.body.resultats[0].score });
    expect(JSON.stringify(recherche)).not.toContain(String(CENTRE.latitude));
  });

  it('accepte un budget saisi librement, hors des raccourcis proposés', async () => {
    await creerOffre('a-12-50', 200, { gratuit: false, prix: 12.5 });
    await creerOffre('a-12-51', 300, { gratuit: false, prix: 12.51 });
    await creerOffre('a-13', 400, { gratuit: false, prix: 13 });

    const res = await recommander({ budgetMax: 12.5 });
    expect(res.status).toBe(200);
    expect(res.body.resultats.map((r: { offre: { titre: string } }) => r.offre.titre)).toEqual(['a-12-50']);

    expect((await recommander({ budgetMax: 37 })).status).toBe(200);
    expect((await recommander({ budgetMax: -1 })).status).toBe(422);
    expect((await recommander({ budgetMax: 10_001 })).status).toBe(422);
    expect((await recommander({ budgetMax: 12.345 })).status).toBe(422); // au centime près
  });

  it('réservé aux citoyens connectés (mode mobile), et valide la requête', async () => {
    const sans = await request(app).post('/api/citoyen/recommandations').send({ ...CENTRE, tempsLibreMinutes: 60 });
    expect(sans.status).toBe(401);
    expect((await recommander({}, signerToken({ id: 'x', role: 'ENTREPRISE' }))).status).toBe(403);
    expect((await recommander({ tempsLibreMinutes: 5 })).status).toBe(422);
    expect((await recommander({ categories: ['casino'] })).status).toBe(422);
  });

  describe('routes publiques', () => {
    it('GET /questions : trois questions bilingues', async () => {
      const res = await request(app).get('/api/citoyen/questions');
      expect(res.body.questions.map((q: { id: string }) => q.id)).toEqual(['tempsLibreMinutes', 'budgetMax', 'categories']);
      expect(res.body.questions[2].choix).toHaveLength(6);
      expect(res.body.questions[1].saisieLibre).toMatchObject({ min: 0, max: 10_000, unite: '€' });
    });

    it('GET /offres (carte) : filtre par zone et catégorie, sans offre non visible', async () => {
      await creerOffre('proche', 300);
      await creerOffre('loin', 5000);
      await creerOffre('sport', 300, { categorieId: idSport });
      await creerOffre('cachee', 100, { statut: 'EN_ATTENTE' });
      const titres = async (q: string) =>
        (await request(app).get(`/api/citoyen/offres?${q}`)).body.elements.map((o: { titre: string }) => o.titre).sort();

      expect(await titres(`latitude=${CENTRE.latitude}&longitude=${CENTRE.longitude}&rayonM=1000`)).toEqual(['proche', 'sport']);
      expect(await titres(`latitude=${CENTRE.latitude}&longitude=${CENTRE.longitude}&categorie=culture`)).toEqual(['proche']);
      expect(await titres('')).toEqual(['loin', 'proche', 'sport']);
      expect((await request(app).get(`/api/citoyen/offres?latitude=48.8`)).status).toBe(422);
    });

    it('GET /offres/:id : fiche publique qui compte les vues (total et par jour), 404 si non visible', async () => {
      const id = await creerOffre('fiche', 100);
      const cachee = await creerOffre('fiche-cachee', 100, { statut: 'EN_ATTENTE' });

      for (let i = 0; i < 3; i++) expect((await request(app).get(`/api/citoyen/offres/${id}`)).status).toBe(200);
      expect((await prismaTest.offre.findUniqueOrThrow({ where: { id } })).vues).toBe(3);
      expect(await prismaTest.statOffreJour.findMany({ where: { offreId: id } })).toEqual([
        expect.objectContaining({ vues: 3 }),
      ]);

      expect((await request(app).get(`/api/citoyen/offres/${cachee}`)).status).toBe(404);
      expect((await prismaTest.offre.findUniqueOrThrow({ where: { id: cachee } })).vues).toBe(0);
    });

    it('POST /interpretations : interprète sans rien enregistrer (RG3)', async () => {
      const compter = () =>
        prismaTest.$queryRaw<{ n: bigint }[]>`
          SELECT (SELECT count(*) FROM "Recherche") + (SELECT count(*) FROM "Recommandation") AS n`;
      const avant = await compter();
      const res = await request(app).post('/api/citoyen/interpretations').send({ texte: 'J’ai 2 h, gratuit, un musée' });
      expect(res.body.interpretation).toEqual({ tempsLibreMinutes: 120, budgetMax: 0, categories: ['culture'] });
      expect(await compter()).toEqual(avant);
      expect((await request(app).post('/api/citoyen/interpretations').send({ texte: 'x'.repeat(501) })).status).toBe(422);
    });
  });
});
