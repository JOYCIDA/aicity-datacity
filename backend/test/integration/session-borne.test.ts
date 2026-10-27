// Séquence 05 sur la base aicity_test : borne → session → recommandation → fin de session.
// L'horloge (Date seulement) est figée et avancée à la main pour jouer RG1 sans attendre.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { baseDisponible, preparerBase, prismaTest } from '../helpers/base-reelle.js';

vi.mock('../../src/prisma/client.js', () => ({ prisma: prismaTest }));

const { createApp } = await import('../../src/app.js');
const { signerToken } = await import('../../src/utils/jwt.js');
const { empreinteSha256 } = await import('../../src/utils/hash.js');
const { purgerSessions } = await import('../../src/jobs/purge.job.js');

const app = createApp();
const T0 = new Date('2026-11-02T14:00:00.000Z');
const BORNE = { nom: 'Borne Hôtel de Ville', emplacement: 'Parvis', latitude: 48.8566, longitude: 2.3522 };
const admin = `Bearer ${signerToken({ id: 'admin', role: 'ADMIN' })}`;

let horloge = T0.getTime();
const avancer = (secondes: number) => vi.setSystemTime((horloge += secondes * 1000));

let cle: string;
let idBorne: string;

const bearer = (jeton: string) => ({ Authorization: `Bearer ${jeton}` });
const ouvrirSession = async (corps: object = {}) => {
  const res = await request(app).post('/api/citoyen/sessions').set('X-Borne-Key', cle).send(corps);
  expect(res.status).toBe(201);
  return res.body as { session: { id: string; expireLe: string }; jeton: string };
};
const sessionExiste = async (id: string) => (await prismaTest.sessionBorne.count({ where: { id } })) === 1;
const etat = (s: { session: { id: string }; jeton: string }) =>
  request(app).get(`/api/citoyen/sessions/${s.session.id}`).set(bearer(s.jeton));

describe.skipIf(!baseDisponible)('sessions de borne (séquence 05)', () => {
  beforeAll(async () => {
    await preparerBase();
    const culture = await prismaTest.categorie.create({
      data: { code: 'culture', libelleFr: 'Culture', libelleEn: 'Culture' },
    });
    // Offres autour de la borne ; aucune près de la position (fausse) que l'usager enverrait.
    for (const [i, metres] of [150, 300, 450].entries()) {
      await prismaTest.offre.create({
        data: {
          titre: `Expo ${i}`,
          lieu: 'Marais',
          latitude: BORNE.latitude + metres / 111_195,
          longitude: BORNE.longitude,
          debut: new Date(T0.getTime() - 86_400_000),
          fin: new Date(T0.getTime() + 30 * 86_400_000),
          dureeMinutes: 30,
          gratuit: true,
          statut: 'VALIDE',
          source: 'PARIS_OPEN_DATA',
          idExterne: `expo-${i}`,
          categorieId: culture.id,
        },
      });
    }
  }, 60_000);

  beforeEach(async () => {
    await prismaTest.$executeRawUnsafe('TRUNCATE "SessionBorne" CASCADE');
    vi.useFakeTimers({ toFake: ['Date'] });
    horloge = T0.getTime();
    vi.setSystemTime(horloge);
  });
  afterEach(() => vi.useRealTimers());
  afterAll(() => prismaTest.$disconnect());

  it('UC22 : l’admin crée la borne ; la clé est rendue une fois, seule son empreinte est stockée (RG17)', async () => {
    const res = await request(app).post('/api/admin/bornes').set('Authorization', admin).send(BORNE);
    expect(res.status).toBe(201);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.cle).toMatch(/^borne_[A-Za-z0-9_-]{43}$/);
    ({ cle } = res.body);
    idBorne = res.body.borne.id;

    const enBase = await prismaTest.borne.findUniqueOrThrow({ where: { id: idBorne } });
    expect(enBase.cleApiHash).toBe(empreinteSha256(cle));
    expect(JSON.stringify(enBase)).not.toContain(cle);

    const liste = await request(app).get('/api/admin/bornes').set('Authorization', admin);
    expect(liste.body.bornes).toHaveLength(1);
    expect(JSON.stringify(liste.body)).not.toMatch(/cle|borne_/i);
  });

  it('une clé fausse ou absente reçoit 401', async () => {
    expect((await request(app).post('/api/citoyen/sessions').set('X-Borne-Key', 'borne_fausse')).status).toBe(401);
    expect((await request(app).post('/api/citoyen/sessions')).status).toBe(401);
  });

  it('UC1 : la borne ouvre une session et reçoit un jeton court ; échéance à +60 s', async () => {
    const { session, jeton } = await ouvrirSession({ langue: 'EN' });
    expect(session).toMatchObject({ langue: 'EN', expireLe: new Date(T0.getTime() + 60_000).toISOString() });
    expect(jeton.split('.')).toHaveLength(3);
    const borne = await prismaTest.borne.findUniqueOrThrow({ where: { id: idBorne } });
    expect(borne.dernierPing).toEqual(T0);
  });

  it('RG2 : la recommandation utilise la position de la borne, pas celle envoyée', async () => {
    const s = await ouvrirSession({ langue: 'EN' });
    const res = await request(app)
      .post('/api/citoyen/recommandations')
      .set(bearer(s.jeton))
      .send({ tempsLibreMinutes: 60, latitude: 43.2965, longitude: 5.3698 }); // Marseille, ignorée
    expect(res.status).toBe(200);
    expect(res.body.resultats.map((r: { offre: { titre: string } }) => r.offre.titre).sort()).toEqual([
      'Expo 0', 'Expo 1', 'Expo 2',
    ]);
    expect(res.body.resultats[0].distanceM).toBeLessThan(500);
    expect(res.body.resultats[0].explication).toMatch(/min walk/); // langue de la session
    const recherche = await prismaTest.recherche.findUniqueOrThrow({ where: { id: res.body.rechercheId } });
    expect(recherche).toMatchObject({ sessionId: s.session.id, utilisateurId: null });
  });

  it('RG1 : chaque appel repousse l’échéance de 60 s, y compris sur les routes publiques', async () => {
    const s = await ouvrirSession();
    avancer(50);
    const res = await request(app).get('/api/citoyen/offres').set(bearer(s.jeton));
    expect(res.status).toBe(200);
    const attendue = new Date(horloge + 60_000).toISOString();
    expect(res.headers['x-session-expire-le']).toBe(attendue);
    expect((await prismaTest.sessionBorne.findUniqueOrThrow({ where: { id: s.session.id } })).expireLe.toISOString()).toBe(attendue);

    avancer(50); // 100 s après l'ouverture, mais 50 s après le dernier appel : toujours vivante
    expect((await etat(s)).status).toBe(200);
  });

  it('RG1 : une session laissée 61 s sans appel renvoie 401 et sa ligne a disparu', async () => {
    const s = await ouvrirSession();
    avancer(61);
    const res = await etat(s);
    expect(res.status).toBe(401);
    expect(res.body.erreur.message).toBe('Session expirée');
    expect(await sessionExiste(s.session.id)).toBe(false);
  });

  it('RG1 : même active, une session ne dépasse pas 10 minutes au total', async () => {
    const s = await ouvrirSession();
    for (let t = 50; t < 600; t += 50) {
      avancer(50);
      const res = await etat(s);
      expect(res.status).toBe(200);
      // L'échéance ne dépasse jamais T0 + 10 min.
      expect(Date.parse(res.body.session.expireLe)).toBeLessThanOrEqual(T0.getTime() + 600_000);
    }
    avancer(50); // T0 + 10 min 00 s
    const fin = await etat(s);
    expect(fin.status).toBe(401);
    expect(fin.body.erreur.message).toBe('Session expirée'); // décidé par la base, pas par le jeton
    expect(await sessionExiste(s.session.id)).toBe(false);
  });

  it('DELETE : la session et ses recherches disparaissent (cascade) ; le jeton ne sert plus', async () => {
    const s = await ouvrirSession();
    for (let i = 0; i < 2; i++) {
      await request(app).post('/api/citoyen/recommandations').set(bearer(s.jeton)).send({ tempsLibreMinutes: 60 });
    }
    expect(await prismaTest.recherche.count({ where: { sessionId: s.session.id } })).toBe(2);
    const nbRecommandations = await prismaTest.recommandation.count({ where: { recherche: { sessionId: s.session.id } } });
    expect(nbRecommandations).toBeGreaterThan(0);

    const res = await request(app).delete(`/api/citoyen/sessions/${s.session.id}`).set(bearer(s.jeton));
    expect(res.status).toBe(204);
    expect(await sessionExiste(s.session.id)).toBe(false);
    expect(await prismaTest.recherche.count({ where: { sessionId: s.session.id } })).toBe(0);
    expect(await prismaTest.recommandation.count({ where: { recherche: { sessionId: s.session.id } } })).toBe(0);
    expect((await etat(s)).status).toBe(401);
  });

  it('une session ne peut ni lire ni fermer celle d’une autre ; un jeton de compte ne suffit pas', async () => {
    const a = await ouvrirSession();
    const b = await ouvrirSession();
    expect((await request(app).delete(`/api/citoyen/sessions/${b.session.id}`).set(bearer(a.jeton))).status).toBe(403);
    expect(await sessionExiste(b.session.id)).toBe(true);
    const citoyen = signerToken({ id: 'u', role: 'CITOYEN' });
    expect((await request(app).get(`/api/citoyen/sessions/${a.session.id}`).set(bearer(citoyen))).status).toBe(401);
  });

  it('la purge (chaque minute) supprime les sessions échues et elles seules', async () => {
    const vieille = await ouvrirSession();
    avancer(45);
    const recente = await ouvrirSession();
    avancer(20); // vieille : 65 s ; récente : 20 s
    expect(await purgerSessions()).toBe(1);
    expect(await sessionExiste(vieille.session.id)).toBe(false);
    expect(await sessionExiste(recente.session.id)).toBe(true);
  });

  it('une borne désactivée perd ses sessions et ne peut plus en ouvrir (403)', async () => {
    const s = await ouvrirSession();
    const res = await request(app)
      .patch(`/api/admin/bornes/${idBorne}`)
      .set('Authorization', admin)
      .send({ statut: 'DESACTIVEE' });
    expect(res.body.borne).toMatchObject({ statut: 'DESACTIVEE', sessionsEnCours: 0 });
    expect(await sessionExiste(s.session.id)).toBe(false);
    expect((await request(app).post('/api/citoyen/sessions').set('X-Borne-Key', cle)).status).toBe(403);

    await request(app).patch(`/api/admin/bornes/${idBorne}`).set('Authorization', admin).send({ statut: 'ACTIVE' });
    expect((await request(app).post('/api/citoyen/sessions').set('X-Borne-Key', cle)).status).toBe(201);
  });

  it('renouveler la clé invalide aussitôt l’ancienne', async () => {
    const res = await request(app).post(`/api/admin/bornes/${idBorne}/cle`).set('Authorization', admin);
    expect(res.status).toBe(200);
    expect(res.body.cle).not.toBe(cle);
    expect((await request(app).post('/api/citoyen/sessions').set('X-Borne-Key', cle)).status).toBe(401);
    cle = res.body.cle;
    await ouvrirSession();
  });

  it('les routes d’administration des bornes sont réservées à l’ADMIN', async () => {
    const citoyen = `Bearer ${signerToken({ id: 'u', role: 'CITOYEN' })}`;
    expect((await request(app).post('/api/admin/bornes').set('Authorization', citoyen).send(BORNE)).status).toBe(403);
    expect((await request(app).post('/api/admin/bornes').set('Authorization', admin).send({ nom: 'x' })).status).toBe(422);
  });
});
