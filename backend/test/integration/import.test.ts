// Séquence 08 sur la base aicity_test, avec les jeux d'essai de data/ à la place du réseau.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { creerDataGouvAdapter } from '../../src/adapters/datagouv.adapter.js';
import { creerOpenAgendaAdapter } from '../../src/adapters/openagenda.adapter.js';
import { creerParisOpenDataAdapter } from '../../src/adapters/parisopendata.adapter.js';
import { baseDisponible, preparerBase, prismaTest } from '../helpers/base-reelle.js';
import {
  fauxFetch,
  fetchDataGouv,
  fetchEnPanne,
  fetchOpenAgenda,
  fetchParis,
  jeuEssai,
} from '../helpers/faux-fetch.js';

vi.mock('../../src/prisma/client.js', () => ({ prisma: prismaTest }));
// Les routes d'administration utilisent ces adaptateurs : aucun appel réseau pendant les tests.
vi.mock('../../src/adapters/index.js', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  adaptateurs: {
    // Réponse retardée : l'import lancé par la route reste EN_COURS le temps du test de verrou.
    parisopendata: creerParisOpenDataAdapter({
      fetch: fauxFetch(async () => {
        await new Promise((r) => setTimeout(r, 300));
        return jeuEssai('parisopendata.sample.json');
      }).fetch,
    }),
    openagenda: creerOpenAgendaAdapter({ agendas: [] }), // non configurée
    datagouv: creerDataGouvAdapter({ dataset: 'ds', ressource: 'rs', fetch: fetchEnPanne }),
  },
}));

const { importer, expirerOffres } = await import('../../src/services/import.service.js');
const { executerImports } = await import('../../src/jobs/import.job.js');
const { createApp } = await import('../../src/app.js');
const { signerToken } = await import('../../src/utils/jwt.js');

// Date figée : les jeux d'essai réels contiennent des événements proches de leur fin.
const MAINTENANT = new Date('2026-10-27T00:00:00Z');
const CATEGORIES = [
  ['culture', 90], ['gastronomie', 75], ['nature', 60], ['sport', 60], ['loisirs', 90], ['shopping', 45],
] as const;

describe.skipIf(!baseDisponible)('import des données publiques (séquence 08)', () => {
  const paris = () => creerParisOpenDataAdapter({ fetch: fetchParis().fetch });
  const nbParis = () => prismaTest.offre.count({ where: { source: 'PARIS_OPEN_DATA' } });

  beforeAll(async () => {
    await preparerBase();
    await prismaTest.categorie.createMany({
      data: CATEGORIES.map(([code, duree]) => ({
        code,
        libelleFr: code,
        libelleEn: code,
        dureeDefautMinutes: duree,
      })),
    });
  }, 60_000);

  afterAll(() => prismaTest.$disconnect());

  it('importe Paris Open Data au statut VALIDE et compte les rejets', async () => {
    const r = await importer(paris(), { maintenant: MAINTENANT });
    const bruts = jeuEssai<any[]>('parisopendata.sample.json');

    expect(r.statut).toBe('TERMINE');
    expect(r.nbCrees).toBeGreaterThan(30);
    expect(r.nbMisAJour).toBe(0);
    expect(r.nbRejetes).toBeGreaterThanOrEqual(5); // sans coordonnées ou sans date dans le jeu réel
    expect(r.message).toMatch(/coordonnees : \d+/);
    expect(r.message).toMatch(/date : \d+/);
    expect(r.nbCrees + r.nbRejetes).toBeLessThanOrEqual(bruts.length);

    expect(await nbParis()).toBe(r.nbCrees);
    const statuts = await prismaTest.offre.groupBy({ by: ['statut'], _count: true });
    expect(statuts).toEqual([{ statut: 'VALIDE', _count: r.nbCrees }]);
    // Événement sans coordonnées du jeu réel : rejeté, donc absent.
    expect(await prismaTest.offre.findFirst({ where: { idExterne: '107076' } })).toBeNull();
  });

  it('relancer le même import : 0 créée, N mises à jour, aucun doublon', async () => {
    const avant = await nbParis();
    const r = await importer(paris(), { maintenant: MAINTENANT });
    expect(r.nbCrees).toBe(0);
    expect(r.nbMisAJour).toBe(avant);
    expect(await nbParis()).toBe(avant);
  });

  it('importe aussi OpenAgenda et data.gouv.fr depuis leurs jeux d’essai', async () => {
    const oa = await importer(
      creerOpenAgendaAdapter({ cle: 'cle', agendas: ['1'], fetch: fetchOpenAgenda().fetch }),
      { maintenant: MAINTENANT },
    );
    // 5 événements : 2 importés, 1 annulé + 1 en ligne ignorés, 1 sans coordonnées rejeté.
    expect(oa).toMatchObject({ statut: 'TERMINE', nbCrees: 2, nbRejetes: 1 });

    const dg = await importer(creerDataGouvAdapter({ dataset: 'ds', ressource: 'rs', fetch: fetchDataGouv().fetch }), {
      maintenant: MAINTENANT,
    });
    expect(dg.statut).toBe('TERMINE');
    expect(dg.nbCrees).toBeGreaterThan(20);
    expect(dg.message).toMatch(/\d+ ignorés/); // webinaires et événements passés
  });

  it('une source en panne finit en ECHEC sans bloquer les suivantes', async () => {
    const avant = await prismaTest.importRapport.count();
    const bilan = await executerImports([
      creerDataGouvAdapter({ dataset: 'ds', ressource: 'rs', fetch: fetchEnPanne }),
      creerOpenAgendaAdapter({ agendas: [] }),
      paris(),
    ]);
    expect(bilan[0]).toMatch(/^datagouv : échec \(www\.data\.gouv\.fr\/.* injoignable/);
    expect(bilan[1]).toMatch(/^openagenda : ignorée/);
    expect(bilan[2]).toMatch(/^parisopendata : 0 créées, \d+ mises à jour/);

    const rapports = await prismaTest.importRapport.findMany({ orderBy: { debutLe: 'desc' }, take: 2 });
    expect(await prismaTest.importRapport.count()).toBe(avant + 2); // pas de rapport pour la source ignorée
    expect(rapports.map((r) => r.statut).sort()).toEqual(['ECHEC', 'TERMINE']);
  });

  it('passe en EXPIREE les offres dont la fin est dépassée', async () => {
    const nb = await expirerOffres(new Date('2027-01-01T00:00:00Z'));
    expect(nb).toBeGreaterThan(0);
    expect(
      await prismaTest.offre.count({ where: { statut: 'VALIDE', fin: { lt: new Date('2027-01-01T00:00:00Z') } } }),
    ).toBe(0);
  });

  describe('routes d’administration', () => {
    const app = createApp();
    const admin = `Bearer ${signerToken({ id: 'admin-test', role: 'ADMIN' })}`;
    const citoyen = `Bearer ${signerToken({ id: 'citoyen-test', role: 'CITOYEN' })}`;

    it('POST /imports/:source/lancer répond 202 puis le rapport aboutit', async () => {
      const res = await request(app).post('/api/admin/imports/parisopendata/lancer').set('Authorization', admin);
      expect(res.status).toBe(202);
      expect(res.body.rapport).toMatchObject({ source: 'PARIS_OPEN_DATA', statut: 'EN_COURS' });

      // Pendant ce temps, un second lancement de la même source est refusé.
      const doublon = await request(app).post('/api/admin/imports/parisopendata/lancer').set('Authorization', admin);
      expect(doublon.status).toBe(409);

      await vi.waitFor(
        async () => {
          const r = await prismaTest.importRapport.findUniqueOrThrow({ where: { id: res.body.rapport.id } });
          expect(r.statut).toBe('TERMINE');
        },
        { timeout: 10_000, interval: 100 },
      );
    });

    it('refuse une source inconnue (422) ou non configurée (409)', async () => {
      const inconnue = await request(app).post('/api/admin/imports/twitter/lancer').set('Authorization', admin);
      expect(inconnue.status).toBe(422);
      const nonConfiguree = await request(app).post('/api/admin/imports/openagenda/lancer').set('Authorization', admin);
      expect(nonConfiguree.status).toBe(409);
      expect(nonConfiguree.body.erreur.message).toMatch(/OPENAGENDA_API_KEY/);
    });

    it('GET /imports liste les rapports, filtrables par source, réservé à l’ADMIN', async () => {
      const tous = await request(app).get('/api/admin/imports').set('Authorization', admin);
      expect(tous.status).toBe(200);
      expect(tous.body.total).toBe(await prismaTest.importRapport.count());

      const echecs = await request(app).get('/api/admin/imports?source=DATA_GOUV').set('Authorization', admin);
      expect(echecs.body.elements.every((r: { source: string }) => r.source === 'DATA_GOUV')).toBe(true);

      expect((await request(app).get('/api/admin/imports').set('Authorization', citoyen)).status).toBe(403);
    });
  });
});
