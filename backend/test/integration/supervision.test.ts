// UC16 sur la base aicity_test : état des bornes (dernier signal), derniers imports, journal
// de modération. L'horloge (Date seulement) est figée pour jouer le silence des bornes.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { baseDisponible, preparerBase, prismaTest } from '../helpers/base-reelle.js';

vi.mock('../../src/prisma/client.js', () => ({ prisma: prismaTest }));

const { createApp } = await import('../../src/app.js');
const { signerToken } = await import('../../src/utils/jwt.js');
const { empreinteSha256 } = await import('../../src/utils/hash.js');
const { surveillerBornes } = await import('../../src/jobs/purge.job.js');

const app = createApp();
const T0 = new Date('2026-11-02T14:00:00.000Z');
const ilYa = (minutes: number) => new Date(T0.getTime() - minutes * 60_000);
const CLE_SILENCIEUSE = 'borne_silencieuse';

describe.skipIf(!baseDisponible)('supervision (UC16)', () => {
  let adminId: string;
  const admin = () => `Bearer ${signerToken({ id: adminId, role: 'ADMIN' })}`;
  const get = (url: string) => request(app).get(url).set('Authorization', admin());

  beforeAll(async () => {
    await preparerBase();
    adminId = (
      await prismaTest.utilisateur.create({ data: { email: 'admin@aicity.test', motDePasseHash: 'x', role: 'ADMIN' } })
    ).id;
    const borne = (nom: string, cle: string, dernierPing: Date | null, statut: 'ACTIVE' | 'DESACTIVEE' = 'ACTIVE') =>
      prismaTest.borne.create({
        data: { nom, emplacement: 'Paris', latitude: 48.85, longitude: 2.35, cleApiHash: empreinteSha256(cle), dernierPing, statut },
      });
    await borne('A – vivante', 'borne_vivante', ilYa(1));
    await borne('B – silencieuse', CLE_SILENCIEUSE, ilYa(6));
    await borne('C – jamais vue', 'borne_jamais', null);
    await borne('D – désactivée', 'borne_desactivee', ilYa(600), 'DESACTIVEE');
  }, 60_000);

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(T0);
  });
  afterEach(() => vi.useRealTimers());
  afterAll(() => prismaTest.$disconnect());

  describe('bornes', () => {
    it('le job de chaque minute passe HORS_LIGNE les bornes actives silencieuses depuis plus de 5 min', async () => {
      expect(await surveillerBornes()).toBe(2);
      const statuts = Object.fromEntries(
        (await prismaTest.borne.findMany()).map((b) => [b.nom.slice(0, 1), b.statut]),
      );
      expect(statuts).toEqual({ A: 'ACTIVE', B: 'HORS_LIGNE', C: 'HORS_LIGNE', D: 'DESACTIVEE' });
      expect(await surveillerBornes()).toBe(0); // rien de plus au passage suivant
    });

    it('GET /admin/bornes/supervision : hors ligne en tête, silence en secondes, résumé', async () => {
      const res = await get('/api/admin/bornes/supervision');
      expect(res.status).toBe(200);
      expect(res.body.seuilSilenceSecondes).toBe(300);
      expect(res.body.resume).toEqual({ ACTIVE: 1, HORS_LIGNE: 2, DESACTIVEE: 1, sessionsEnCours: 0 });
      expect(
        res.body.bornes.map((b: { nom: string; statut: string; silenceSecondes: number | null }) => [
          b.nom.slice(0, 1),
          b.statut,
          b.silenceSecondes,
        ]),
      ).toEqual([
        ['B', 'HORS_LIGNE', 360],
        ['C', 'HORS_LIGNE', null],
        ['A', 'ACTIVE', 60],
        ['D', 'DESACTIVEE', 36_000],
      ]);
      expect(JSON.stringify(res.body)).not.toMatch(/cle|borne_/i);
    });

    it('POST /citoyen/bornes/signal : la borne qui se manifeste redevient ACTIVE', async () => {
      const res = await request(app).post('/api/citoyen/bornes/signal').set('X-Borne-Key', CLE_SILENCIEUSE);
      expect(res.status).toBe(204);
      const b = await prismaTest.borne.findFirstOrThrow({ where: { nom: { startsWith: 'B' } } });
      expect(b).toMatchObject({ statut: 'ACTIVE', dernierPing: T0 });
      expect((await request(app).post('/api/citoyen/bornes/signal').set('X-Borne-Key', 'borne_desactivee')).status).toBe(403);
      expect((await request(app).post('/api/citoyen/bornes/signal')).status).toBe(401);
    });
  });

  describe('imports', () => {
    it('GET /admin/imports/derniers : dernier rapport par source et alertes', async () => {
      const heures = (h: number) => new Date(T0.getTime() - h * 3_600_000);
      await prismaTest.importRapport.createMany({
        data: [
          // Paris : réussi cette nuit (le rapport précédent, plus ancien, ne compte pas).
          { source: 'PARIS_OPEN_DATA', debutLe: heures(35), finLe: heures(35), statut: 'ECHEC', message: 'ancien' },
          { source: 'PARIS_OPEN_DATA', debutLe: heures(11), finLe: heures(11), statut: 'TERMINE', nbCrees: 3 },
          // data.gouv.fr : réussi hier, en échec cette nuit.
          { source: 'DATA_GOUV', debutLe: heures(35), finLe: heures(35), statut: 'TERMINE', nbCrees: 5 },
          { source: 'DATA_GOUV', debutLe: heures(11), finLe: heures(11), statut: 'ECHEC', message: 'HTTP 503' },
        ],
      });
      const res = await get('/api/admin/imports/derniers');
      expect(res.status).toBe(200);
      const parCode = Object.fromEntries(res.body.sources.map((s: { code: string }) => [s.code, s]));
      expect(Object.keys(parCode)).toEqual(['parisopendata', 'openagenda', 'datagouv']);

      expect(parCode.parisopendata).toMatchObject({
        configuree: true,
        alerte: null,
        dernier: { statut: 'TERMINE', nbCrees: 3 },
        dernierSucces: { statut: 'TERMINE' },
      });
      expect(parCode.datagouv).toMatchObject({
        alerte: 'Dernier import en échec',
        dernier: { statut: 'ECHEC', message: 'HTTP 503' },
        dernierSucces: { nbCrees: 5 },
      });
      // Jamais importée ici : non configurée, ou sans import réussi, selon le .env local.
      expect(parCode.openagenda).toMatchObject({ dernier: null, dernierSucces: null });
      expect(parCode.openagenda.alerte).toMatch(/Non configurée|Aucun import réussi/);
    });

    it('sans succès depuis plus de 26 h, la source est signalée', async () => {
      vi.setSystemTime(new Date(T0.getTime() + 16 * 3_600_000)); // succès Paris vieux de 27 h
      const res = await get('/api/admin/imports/derniers');
      const paris = res.body.sources.find((s: { code: string }) => s.code === 'parisopendata');
      expect(paris.alerte).toBe('Aucun import réussi depuis plus de 26 h');
    });
  });

  describe('journal de modération', () => {
    let offreId: string;

    beforeAll(async () => {
      const categorie = await prismaTest.categorie.create({ data: { code: 'culture', libelleFr: 'Culture', libelleEn: 'Culture' } });
      const entreprise = await prismaTest.entreprise.create({
        data: {
          nom: 'Galerie',
          typeActivite: 'Art',
          adresse: '1 rue de Paris',
          utilisateur: { create: { email: 'galerie@aicity.test', motDePasseHash: 'x', role: 'ENTREPRISE' } },
        },
      });
      offreId = (
        await prismaTest.offre.create({
          data: {
            entrepriseId: entreprise.id,
            categorieId: categorie.id,
            titre: 'Vernissage',
            lieu: 'Galerie',
            latitude: 48.85,
            longitude: 2.35,
            debut: T0,
            dureeMinutes: 60,
          },
        })
      ).id;
      await prismaTest.journalModeration.createMany({
        data: [
          { adminId, entrepriseId: entreprise.id, decision: 'VALIDE', creeLe: ilYa(120) },
          { adminId, offreId, decision: 'REFUSE', motif: 'Photo manquante', creeLe: ilYa(60) },
          { adminId, offreId, decision: 'VALIDE', creeLe: ilYa(10) },
        ],
      });
    });

    it('GET /admin/journal : du plus récent au plus ancien, avec l’admin, l’offre et l’entreprise', async () => {
      const res = await get('/api/admin/journal');
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(3);
      expect(res.body.elements.map((l: { decision: string }) => l.decision)).toEqual(['VALIDE', 'REFUSE', 'VALIDE']);
      expect(res.body.elements[1]).toMatchObject({
        motif: 'Photo manquante',
        admin: { id: adminId, email: 'admin@aicity.test' },
        offre: { id: offreId, titre: 'Vernissage' },
        entreprise: null,
      });
      expect(res.body.elements[2]).toMatchObject({ offre: null, entreprise: { nom: 'Galerie' } });
    });

    it('filtres : décision, offre, période ; paramètres invalides : 422', async () => {
      expect((await get('/api/admin/journal?decision=REFUSE')).body.total).toBe(1);
      expect((await get(`/api/admin/journal?offreId=${offreId}`)).body.total).toBe(2);
      const du = encodeURIComponent(ilYa(90).toISOString());
      expect((await get(`/api/admin/journal?du=${du}`)).body.total).toBe(2);
      expect((await get('/api/admin/journal?taille=1&page=2')).body.elements).toHaveLength(1);
      expect((await get('/api/admin/journal?decision=PEUT_ETRE')).status).toBe(422);
      expect((await get('/api/admin/journal?du=2026-11-02&au=2026-11-01')).status).toBe(422);
    });

    it('réservé à l’ADMIN', async () => {
      const entreprise = `Bearer ${signerToken({ id: 'e', role: 'ENTREPRISE' })}`;
      for (const url of ['/api/admin/journal', '/api/admin/bornes/supervision', '/api/admin/imports/derniers']) {
        expect((await request(app).get(url).set('Authorization', entreprise)).status).toBe(403);
      }
    });
  });
});
