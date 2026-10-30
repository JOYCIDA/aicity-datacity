// Langue des offres (?langue=), traduction automatique, photos (crédit, description) et qualité
// des coordonnées à l'import, sur la base aicity_test.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { OffreNormalisee, SourceAdapter } from '../../src/adapters/source.adapter.js';
import { baseDisponible, preparerBase, prismaTest } from '../helpers/base-reelle.js';

vi.mock('../../src/prisma/client.js', () => ({ prisma: prismaTest }));

const { createApp } = await import('../../src/app.js');
const { importer } = await import('../../src/services/import.service.js');
const { traduireOffresManquantes } = await import('../../src/services/traduction.service.js');

const app = createApp();
const CENTRE = { latitude: 48.8566, longitude: 2.3522 };
let idCulture: string;

const creerOffre = (titre: string, o: Record<string, unknown> = {}) =>
  prismaTest.offre.create({
    data: {
      titre,
      lieu: `Lieu ${titre}`,
      latitude: CENTRE.latitude + 0.001,
      longitude: CENTRE.longitude,
      debut: new Date(Date.now() - 3600_000),
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

/** Traducteur de test : préfixe chaque texte, et compte ce qu'on lui envoie. */
const faux = () => {
  const recus: string[][] = [];
  return { recus, traduire: async (t: string[]) => (recus.push(t), t.map((x) => `EN ${x}`)) };
};

describe.skipIf(!baseDisponible)('langue, traduction, photos, qualité des coordonnées', () => {
  beforeAll(async () => {
    await preparerBase();
    idCulture = (
      await prismaTest.categorie.create({
        data: { code: 'culture', libelleFr: 'Culture', libelleEn: 'Culture', dureeDefautMinutes: 20 },
      })
    ).id;
  }, 60_000);

  beforeEach(async () => {
    await prismaTest.$executeRawUnsafe('TRUNCATE "Offre" CASCADE');
  });

  afterAll(() => prismaTest.$disconnect());

  describe('?langue= sur les offres publiques', () => {
    it('fiche : français par défaut, anglais sur demande, repli français sans traduction', async () => {
      const traduite = await creerOffre('Expo photo', { titreEn: 'Photo show', descriptionEn: 'A show', description: 'Une expo', lieuEn: 'Gallery' });
      const brute = await creerOffre('Concert', { description: 'Un concert' });

      const fr = await request(app).get(`/api/citoyen/offres/${traduite.id}`);
      expect(fr.body.offre).toMatchObject({ titre: 'Expo photo', langue: 'FR' });
      expect(fr.body.offre).not.toHaveProperty('titreEn');

      const en = await request(app).get(`/api/citoyen/offres/${traduite.id}?langue=en`);
      expect(en.body.offre).toMatchObject({ titre: 'Photo show', description: 'A show', lieu: 'Gallery', langue: 'EN', traduit: true });

      const repli = await request(app).get(`/api/citoyen/offres/${brute.id}?langue=EN`);
      expect(repli.body.offre).toMatchObject({ titre: 'Concert', description: 'Un concert', langue: 'EN', traduit: false });
    });

    it('liste : même règle ; une langue inconnue est refusée (422)', async () => {
      await creerOffre('Expo photo', { titreEn: 'Photo show', lieuEn: 'Gallery' });
      const en = await request(app).get('/api/citoyen/offres?langue=EN');
      expect(en.status).toBe(200);
      expect(en.body.elements[0]).toMatchObject({ titre: 'Photo show', lieu: 'Gallery', langue: 'EN' });
      expect((await request(app).get('/api/citoyen/offres?langue=DE')).status).toBe(422);
    });

    it('recommandations : la langue de la demande s’applique aux titres comme à l’explication', async () => {
      await creerOffre('Expo photo', { titreEn: 'Photo show', lieuEn: 'Gallery' });
      const { body } = await request(app).post('/api/citoyen/sessions/anonyme').send({});
      const res = await request(app)
        .post('/api/citoyen/recommandations')
        .set('Authorization', `Bearer ${body.jeton}`)
        .send({ ...CENTRE, tempsLibreMinutes: 30, langue: 'EN' });
      expect(res.status).toBe(200);
      expect(res.body.resultats[0].offre).toMatchObject({ titre: 'Photo show', langue: 'EN' });
      expect(res.body.resultats[0].explication).toMatch(/min walk/);
    });
  });

  describe('photo : crédit et description', () => {
    it('sont renvoyés par la fiche et la liste', async () => {
      const o = await creerOffre('Expo', {
        photoUrl: 'https://cdn.paris.fr/x.jpg',
        photoCredit: '© Ville de Paris',
        photoAlt: 'Visiteurs devant une photographie',
      });
      const fiche = await request(app).get(`/api/citoyen/offres/${o.id}`);
      expect(fiche.body.offre).toMatchObject({ photoCredit: '© Ville de Paris', photoAlt: 'Visiteurs devant une photographie' });
      const liste = await request(app).get('/api/citoyen/offres');
      expect(liste.body.elements[0]).toHaveProperty('photoCredit', '© Ville de Paris');
    });
  });

  describe('traduction automatique', () => {
    it('traduit titre, description et lieu des offres visibles qui n’ont pas d’anglais, puis ne refait rien', async () => {
      const a = await creerOffre('Expo', { description: 'Une expo' });
      await creerOffre('En attente', { statut: 'EN_ATTENTE' });
      const t = faux();

      const bilan = await traduireOffresManquantes(t);
      expect(bilan).toMatchObject({ offres: 1, interrompu: null });
      expect(await prismaTest.offre.findUniqueOrThrow({ where: { id: a.id } })).toMatchObject({
        titreEn: 'EN Expo',
        descriptionEn: 'EN Une expo',
        lieuEn: 'EN Lieu Expo',
      });
      expect(t.recus.flat()).not.toContain('En attente'); // une offre non validée n'est jamais envoyée

      expect(await traduireOffresManquantes(t)).toMatchObject({ offres: 0 });
      expect(t.recus).toHaveLength(1);
    });

    it('ne renvoie pas ce qui est déjà en anglais (fourni par la source ou l’entreprise)', async () => {
      await creerOffre('Expo', { titreEn: 'Show', description: null, lieuEn: 'Hall' });
      const t = faux();
      await traduireOffresManquantes(t);
      expect(t.recus).toHaveLength(0);
    });

    it('s’arrête au plafond de caractères et reprend à l’exécution suivante', async () => {
      for (const n of ['aaa', 'bbb', 'ccc']) await creerOffre(n, { debut: new Date(Date.now() - 1000 * (10 - n.length)) });
      const t = faux();
      const bilan = await traduireOffresManquantes(t, { limiteCaracteres: 10 });
      expect(bilan.interrompu).toMatch(/plafond/);
      expect(bilan.offres).toBe(0); // un lot de 3 offres (3 titres + 3 lieux) dépasse 10 caractères
      expect(await traduireOffresManquantes(t, { limiteCaracteres: 10_000 })).toMatchObject({ offres: 3, interrompu: null });
    });

    it('rapporte l’erreur du fournisseur sans rien écrire ni lever d’exception', async () => {
      const a = await creerOffre('Expo');
      const bilan = await traduireOffresManquantes({
        traduire: async () => {
          throw new Error('DeepL a répondu HTTP 456');
        },
      });
      expect(bilan).toMatchObject({ offres: 0, interrompu: 'DeepL a répondu HTTP 456' });
      expect((await prismaTest.offre.findUniqueOrThrow({ where: { id: a.id } })).titreEn).toBeNull();
    });
  });

  describe('import : photos, traductions périmées, coordonnées douteuses', () => {
    const offre = (idExterne: string, o: Partial<OffreNormalisee> = {}): OffreNormalisee => ({
      idExterne,
      titre: `Titre ${idExterne}`,
      description: 'Description',
      lieu: `Lieu ${idExterne}`,
      adresse: `${idExterne} rue des Tests, 75011 Paris`,
      latitude: 48.86 + Number(idExterne.replace(/\D/g, '') || 0) / 1000,
      longitude: 2.38,
      debut: new Date(Date.now() - 3600_000),
      fin: new Date(Date.now() + 5 * 24 * 3600_000),
      dureeMinutes: null,
      categorieCode: 'culture',
      prix: null,
      gratuit: true,
      photoUrl: null,
      sourceUrl: null,
      ...o,
    });
    const adapter = (offres: OffreNormalisee[]): SourceAdapter<OffreNormalisee> => ({
      code: 'parisopendata',
      source: 'PARIS_OPEN_DATA',
      configurationManquante: () => null,
      recuperer: async () => offres,
      normaliser: (o) => o,
    });

    it('importe crédit et description de la photo, et les efface si la photo disparaît', async () => {
      await importer(adapter([offre('e1', { photoUrl: 'https://x/p.jpg', photoCredit: '© A', photoAlt: 'Une scène' })]));
      expect(await prismaTest.offre.findFirstOrThrow({ where: { idExterne: 'e1' } })).toMatchObject({ photoCredit: '© A', photoAlt: 'Une scène' });
      await importer(adapter([offre('e1', { photoUrl: null, photoCredit: '© A' })]));
      expect(await prismaTest.offre.findFirstOrThrow({ where: { idExterne: 'e1' } })).toMatchObject({ photoUrl: null, photoCredit: null, photoAlt: null });
    });

    it('applique la durée par défaut de la catégorie : une offre importée tient dans 30 min', async () => {
      await importer(adapter([offre('e1', { latitude: 48.8575, longitude: 2.3522 })]));
      expect((await prismaTest.offre.findFirstOrThrow({ where: { idExterne: 'e1' } })).dureeMinutes).toBe(20);
      const { body } = await request(app).post('/api/citoyen/sessions/anonyme').send({});
      const res = await request(app)
        .post('/api/citoyen/recommandations')
        .set('Authorization', `Bearer ${body.jeton}`)
        .send({ ...CENTRE, tempsLibreMinutes: 30 });
      expect(res.body.resultats).toHaveLength(1);
    });

    it('efface la traduction quand le texte français change, la garde sinon', async () => {
      await importer(adapter([offre('e1'), offre('e2')]));
      await prismaTest.offre.updateMany({ data: { titreEn: 'Old', descriptionEn: 'Old desc', lieuEn: 'Old place' } });
      await importer(adapter([offre('e1', { titre: 'Nouveau titre' }), offre('e2')]));
      expect(await prismaTest.offre.findFirstOrThrow({ where: { idExterne: 'e1' } })).toMatchObject({ titre: 'Nouveau titre', titreEn: null, descriptionEn: 'Old desc' });
      expect(await prismaTest.offre.findFirstOrThrow({ where: { idExterne: 'e2' } })).toMatchObject({ titreEn: 'Old' });
    });

    it('prend l’anglais fourni par la source et ne l’écrase pas par un null', async () => {
      await importer(adapter([offre('e1', { titreEn: 'Source title' })]));
      expect((await prismaTest.offre.findFirstOrThrow({ where: { idExterne: 'e1' } })).titreEn).toBe('Source title');
      await importer(adapter([offre('e1')]));
      expect((await prismaTest.offre.findFirstOrThrow({ where: { idExterne: 'e1' } })).titreEn).toBe('Source title');
    });

    it('rejette les coordonnées par défaut de Paris, retire une offre déjà publiée et compte le rejet', async () => {
      const parDefaut = { latitude: 48.856578, longitude: 2.351828 };
      await importer(adapter([offre('e1', { ...parDefaut, adresse: '2 Rue du cinéma, 75001 Paris' }), offre('e2')]));
      // 1er import : accepté par erreur plus tôt ? On simule une offre déjà publiée au point par défaut.
      await prismaTest.offre.create({
        data: {
          titre: 'Ancienne', lieu: 'Ancien lieu', ...parDefaut, debut: new Date(), fin: new Date(Date.now() + 86_400_000),
          dureeMinutes: 20, gratuit: true, statut: 'VALIDE', source: 'PARIS_OPEN_DATA', idExterne: 'e3', categorieId: idCulture,
        },
      });
      const r = await importer(adapter([offre('e2'), offre('e3', { ...parDefaut, adresse: '9 rue Inconnue, 75003 Paris' })]));
      expect(r.nbRejetes).toBeGreaterThanOrEqual(1);
      expect(await prismaTest.offre.count({ where: { idExterne: 'e1' } })).toBe(0);
      expect((await prismaTest.offre.findFirstOrThrow({ where: { idExterne: 'e3' } })).statut).toBe('EXPIREE');
      expect((await prismaTest.offre.findFirstOrThrow({ where: { idExterne: 'e2' } })).statut).toBe('VALIDE');
    });
  });
});
