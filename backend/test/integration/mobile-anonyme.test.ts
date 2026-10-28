// Mobile sans compte : session anonyme, recommandation sans rien enregistrer, signalement.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { baseDisponible, preparerBase, prismaTest } from '../helpers/base-reelle.js';

vi.mock('../../src/prisma/client.js', () => ({ prisma: prismaTest }));

const { createApp } = await import('../../src/app.js');
const { signerToken, signerJetonAnonyme } = await import('../../src/utils/jwt.js');

const app = createApp();
const CENTRE = { latitude: 48.8566, longitude: 2.3522 };
const bearer = (jeton: string) => ({ Authorization: `Bearer ${jeton}` });

let idCulture: string;
let idOffre: string;

const ouvrirAnonyme = async (corps: object = {}) => {
  const res = await request(app).post('/api/citoyen/sessions/anonyme').send(corps);
  expect(res.status).toBe(201);
  return res.body as { jeton: string; expireLe: string; langue: string };
};

describe.skipIf(!baseDisponible)('mobile sans compte', () => {
  beforeAll(async () => {
    await preparerBase();
    idCulture = (
      await prismaTest.categorie.create({ data: { code: 'culture', libelleFr: 'Culture', libelleEn: 'Culture' } })
    ).id;
  }, 60_000);

  beforeEach(async () => {
    await prismaTest.$executeRawUnsafe('TRUNCATE "Signalement", "Recherche", "Offre", "SessionBorne" CASCADE');
    idOffre = (
      await prismaTest.offre.create({
        data: {
          titre: 'Expo photo',
          lieu: 'Galerie',
          latitude: CENTRE.latitude + 0.001,
          longitude: CENTRE.longitude,
          debut: new Date(Date.now() - 3600_000),
          fin: new Date(Date.now() + 30 * 24 * 3600_000),
          dureeMinutes: 20,
          gratuit: true,
          statut: 'VALIDE',
          source: 'PARIS_OPEN_DATA',
          idExterne: 'expo',
          categorieId: idCulture,
        },
      })
    ).id;
  });

  afterAll(() => prismaTest.$disconnect());

  describe('POST /api/citoyen/sessions/anonyme', () => {
    it('délivre un jeton sans compte, sans clé de borne, et ne crée aucune ligne', async () => {
      const avant = await prismaTest.sessionBorne.count();
      const { jeton, expireLe, langue } = await ouvrirAnonyme({ langue: 'EN' });
      expect(jeton).toEqual(expect.any(String));
      expect(langue).toBe('EN');
      expect(new Date(expireLe).getTime()).toBeGreaterThan(Date.now());
      expect(await prismaTest.sessionBorne.count()).toBe(avant);
      expect(await prismaTest.utilisateur.count({ where: { email: { contains: 'anonyme' } } })).toBe(0);
    });

    it('refuse une langue inconnue (422)', async () => {
      const res = await request(app).post('/api/citoyen/sessions/anonyme').send({ langue: 'DE' });
      expect(res.status).toBe(422);
    });
  });

  describe('recommandations avec une session anonyme', () => {
    const corps = { ...CENTRE, tempsLibreMinutes: 60 };

    it('répond avec des offres et n’enregistre ni recherche, ni recommandation, ni position', async () => {
      const { jeton } = await ouvrirAnonyme();
      const res = await request(app).post('/api/citoyen/recommandations').set(bearer(jeton)).send(corps);
      expect(res.status).toBe(200);
      expect(res.body.rechercheId).toBeNull();
      expect(res.body.resultats).toHaveLength(1);
      expect(res.body.resultats[0].offre.id).toBe(idOffre);
      expect(await prismaTest.recherche.count()).toBe(0);
      expect(await prismaTest.recommandation.count()).toBe(0);
      // RG19 : seul le compteur anonyme du jour est incrémenté.
      expect(await prismaTest.statOffreJour.findFirst({ where: { offreId: idOffre } })).toMatchObject({ recommandations: 1 });
    });

    it('exige la position dans la requête (RG2, 422 sinon)', async () => {
      const { jeton } = await ouvrirAnonyme();
      const res = await request(app)
        .post('/api/citoyen/recommandations')
        .set(bearer(jeton))
        .send({ tempsLibreMinutes: 60 });
      expect(res.status).toBe(422);
    });

    it('401 sans jeton ou avec un jeton quelconque, 401 avec un jeton anonyme expiré', async () => {
      expect((await request(app).post('/api/citoyen/recommandations').send(corps)).status).toBe(401);
      const faux = await request(app).post('/api/citoyen/recommandations').set(bearer('abc')).send(corps);
      expect(faux.status).toBe(401);
      const expire = await request(app)
        .post('/api/citoyen/recommandations')
        .set(bearer(signerJetonAnonyme(-10)))
        .send(corps);
      expect(expire.status).toBe(401);
    });

    it('le jeton d’un compte ADMIN reste refusé (403)', async () => {
      const admin = signerToken({ id: 'a', role: 'ADMIN' });
      const res = await request(app).post('/api/citoyen/recommandations').set(bearer(admin)).send(corps);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/citoyen/signalement', () => {
    const signalement = () => ({ offreId: idOffre, motif: 'OFFRE_EXPIREE', commentaire: '  Fermé depuis hier  ' });

    it('enregistre un signalement anonyme, sans aucune identité', async () => {
      const { jeton } = await ouvrirAnonyme();
      const res = await request(app).post('/api/citoyen/signalement').set(bearer(jeton)).send(signalement());
      expect(res.status).toBe(201);
      const ligne = await prismaTest.signalement.findUniqueOrThrow({ where: { id: res.body.signalement.id } });
      expect(ligne).toMatchObject({ offreId: idOffre, motif: 'OFFRE_EXPIREE', commentaire: 'Fermé depuis hier', traite: false });
      expect(Object.keys(ligne).sort()).toEqual(['commentaire', 'creeLe', 'id', 'motif', 'offreId', 'traite']);
    });

    it('accepte aussi un compte CITOYEN', async () => {
      const u = await prismaTest.utilisateur.create({
        data: { email: 'signal@aicity.test', motDePasseHash: 'x', role: 'CITOYEN' },
      });
      const res = await request(app)
        .post('/api/citoyen/signalement')
        .set(bearer(signerToken({ id: u.id, role: 'CITOYEN' })))
        .send({ offreId: idOffre, motif: 'AUTRE' });
      expect(res.status).toBe(201);
    });

    it('401 sans jeton ; 422 pour un motif inconnu ou un commentaire trop long ; 404 pour une offre invisible', async () => {
      expect((await request(app).post('/api/citoyen/signalement').send(signalement())).status).toBe(401);
      const { jeton } = await ouvrirAnonyme();
      const post = (corps: object) => request(app).post('/api/citoyen/signalement').set(bearer(jeton)).send(corps);
      expect((await post({ ...signalement(), motif: 'AUTRE_CHOSE' })).status).toBe(422);
      expect((await post({ ...signalement(), commentaire: 'x'.repeat(501) })).status).toBe(422);
      await prismaTest.offre.update({ where: { id: idOffre }, data: { statut: 'EN_ATTENTE' } });
      expect((await post(signalement())).status).toBe(404);
      expect(await prismaTest.signalement.count()).toBe(0);
    });
  });

  describe('administration des signalements', () => {
    const admin = bearer(signerToken({ id: 'admin', role: 'ADMIN' }));

    it('l’admin liste, filtre puis marque un signalement comme traité ; un citoyen ne le peut pas', async () => {
      const a = await prismaTest.signalement.create({ data: { offreId: idOffre, motif: 'LIEU_INCORRECT' } });
      await prismaTest.signalement.create({ data: { offreId: idOffre, motif: 'AUTRE', traite: true } });

      const liste = await request(app).get('/api/admin/signalements?traite=false').set(admin);
      expect(liste.status).toBe(200);
      expect(liste.body.total).toBe(1);

      const maj = await request(app).patch(`/api/admin/signalements/${a.id}`).set(admin).send({});
      expect(maj.status).toBe(200);
      expect(maj.body.signalement.traite).toBe(true);
      expect((await request(app).patch('/api/admin/signalements/inconnu-id').set(admin).send({})).status).toBe(404);

      const citoyen = bearer(signerToken({ id: 'c', role: 'CITOYEN' }));
      expect((await request(app).get('/api/admin/signalements').set(citoyen)).status).toBe(403);
    });

    it('supprimer une offre supprime ses signalements', async () => {
      await prismaTest.signalement.create({ data: { offreId: idOffre, motif: 'AUTRE' } });
      await prismaTest.offre.delete({ where: { id: idOffre } });
      expect(await prismaTest.signalement.count()).toBe(0);
    });
  });
});
