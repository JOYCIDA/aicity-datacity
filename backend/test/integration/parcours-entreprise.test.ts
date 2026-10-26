// Séquence 06 jouée de bout en bout sur une vraie base PostgreSQL (transactions, contraintes).
// Base dédiée : TEST_DATABASE_URL (aicity_test par défaut), vidée avant le parcours.
// Le fichier est ignoré si la base n'est pas joignable.
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client.js';

const config = vi.hoisted(() => {
  const url = process.env.TEST_DATABASE_URL ?? 'postgresql://aicity:aicity@localhost:5432/aicity_test';
  process.env.DATABASE_URL = url;
  return { url };
});
const dossierUploads = mkdtempSync(path.join(tmpdir(), 'aicity-uploads-'));
process.env.UPLOAD_DIR = dossierUploads;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: config.url }) });
vi.mock('../../src/prisma/client.js', () => ({ prisma }));

const { createApp } = await import('../../src/app.js');

const baseDisponible = await prisma.$queryRaw`SELECT 1`.then(
  () => true,
  () => false,
);

const app = createApp();
const PDF = Buffer.from('%PDF-1.4\n% justificatif de test\n');
const auth = (jeton: string) => ({ Authorization: `Bearer ${jeton}` });

async function inscrireEntreprise(email: string, nom: string) {
  const res = await request(app)
    .post('/api/auth/inscription')
    .send({
      role: 'ENTREPRISE',
      email,
      motDePasse: 'motdepasse123',
      entreprise: { nom, typeActivite: 'Restaurant', adresse: '1 place de la Bastille, Paris' },
    });
  expect(res.status).toBe(201);
  return res.body.token as string;
}

const nouvelleOffre = {
  categorieCode: 'gastronomie',
  titre: 'Dégustation de fromages',
  lieu: 'Fromagerie du Marais',
  adresse: '5 rue des Archives, Paris',
  latitude: 48.8575,
  longitude: 2.3556,
  debut: '2030-01-10T10:00:00.000Z',
  fin: '2030-12-31T18:00:00.000Z',
  dureeMinutes: 45,
  prix: 12.5,
};

describe.skipIf(!baseDisponible)('parcours entreprise → modération → offre visible (séquence 06)', () => {
  let admin: string;
  let entrepriseA: string;
  let entrepriseB: string;
  let idEntrepriseA: string;
  let idOffre: string;

  const offresPubliques = async () =>
    (await request(app).get('/api/citoyen/offres')).body.elements.map((o: { id: string }) => o.id);

  beforeAll(async () => {
    execSync('npx prisma migrate deploy', { env: { ...process.env, DATABASE_URL: config.url }, stdio: 'ignore' });
    await prisma.$executeRawUnsafe(
      'TRUNCATE "JournalModeration", "Offre", "Entreprise", "Utilisateur", "Categorie" CASCADE',
    );
    await prisma.categorie.create({
      data: { code: 'gastronomie', libelleFr: 'Gastronomie', libelleEn: 'Food & drink' },
    });
    await prisma.utilisateur.create({
      data: { email: 'admin@aicity.test', role: 'ADMIN', motDePasseHash: await bcrypt.hash('motdepasse-admin', 4) },
    });
    const connexion = await request(app)
      .post('/api/auth/connexion')
      .send({ email: 'admin@aicity.test', motDePasse: 'motdepasse-admin' });
    admin = connexion.body.token;

    entrepriseA = await inscrireEntreprise('a@aicity.test', 'Fromagerie A');
    entrepriseB = await inscrireEntreprise('b@aicity.test', 'Bistrot B');
  }, 60_000);

  afterAll(async () => {
    await prisma.$disconnect();
    rmSync(dossierUploads, { recursive: true, force: true });
  });

  it('RG8 : une entreprise EN_ATTENTE ne peut pas publier (403)', async () => {
    const res = await request(app).post('/api/entreprise/offres').set(auth(entrepriseA)).send(nouvelleOffre);
    expect(res.status).toBe(403);
  });

  it('refuse un justificatif trop lourd, d’un mauvais type ou au contenu falsifié', async () => {
    const lourd = await request(app)
      .post('/api/entreprise/justificatif')
      .set(auth(entrepriseA))
      .attach('justificatif', Buffer.concat([PDF, Buffer.alloc(5 * 1024 * 1024)]), 'gros.pdf');
    expect(lourd.status).toBe(413);

    const texte = await request(app)
      .post('/api/entreprise/justificatif')
      .set(auth(entrepriseA))
      .attach('justificatif', Buffer.from('bonjour'), { filename: 'a.txt', contentType: 'text/plain' });
    expect(texte.status).toBe(415);

    const faux = await request(app)
      .post('/api/entreprise/justificatif')
      .set(auth(entrepriseA))
      .attach('justificatif', Buffer.from('MZ pas un pdf'), { filename: 'kbis.pdf', contentType: 'application/pdf' });
    expect(faux.status).toBe(415);
  });

  it('l’administration ne valide pas un compte sans justificatif (409)', async () => {
    const liste = await request(app).get('/api/admin/entreprises?statut=EN_ATTENTE').set(auth(admin));
    idEntrepriseA = liste.body.elements.find((e: { nom: string }) => e.nom === 'Fromagerie A').id;
    const res = await request(app)
      .patch(`/api/admin/entreprises/${idEntrepriseA}/decision`)
      .set(auth(admin))
      .send({ decision: 'VALIDE' });
    expect(res.status).toBe(409);
  });

  it('téléverse le justificatif puis l’administration valide le compte (transaction + journal)', async () => {
    const envoi = await request(app)
      .post('/api/entreprise/justificatif')
      .set(auth(entrepriseA))
      .attach('justificatif', PDF, { filename: 'kbis.pdf', contentType: 'application/pdf' });
    expect(envoi.status).toBe(201);
    expect(envoi.body.entreprise.justificatifFourni).toBe(true);

    const fichier = await request(app).get(`/api/admin/entreprises/${idEntrepriseA}/justificatif`).set(auth(admin));
    expect(fichier.status).toBe(200);

    const liste = await request(app).get('/api/admin/entreprises').set(auth(admin));
    expect(liste.body.elements.map((e: { nom: string }) => e.nom)).toEqual(['Fromagerie A', 'Bistrot B']);

    const decision = await request(app)
      .patch(`/api/admin/entreprises/${idEntrepriseA}/decision`)
      .set(auth(admin))
      .send({ decision: 'VALIDE' });
    expect(decision.status).toBe(200);
    expect(decision.body.entreprise.statut).toBe('ACTIF');
    expect(await prisma.journalModeration.count({ where: { entrepriseId: idEntrepriseA } })).toBe(1);

    const doublon = await request(app)
      .patch(`/api/admin/entreprises/${idEntrepriseA}/decision`)
      .set(auth(admin))
      .send({ decision: 'VALIDE' });
    expect(doublon.status).toBe(409);
    expect(await prisma.journalModeration.count({ where: { entrepriseId: idEntrepriseA } })).toBe(1);

    // B est validée aussi : son 403 plus bas viendra bien de RG16, pas de RG8.
    await request(app)
      .post('/api/entreprise/justificatif')
      .set(auth(entrepriseB))
      .attach('justificatif', PDF, { filename: 'kbis.pdf', contentType: 'application/pdf' });
    const idB = (await request(app).get('/api/entreprise/profil').set(auth(entrepriseB))).body.entreprise.id;
    const validationB = await request(app)
      .patch(`/api/admin/entreprises/${idB}/decision`)
      .set(auth(admin))
      .send({ decision: 'VALIDE' });
    expect(validationB.status).toBe(200);
  });

  it('RG5 : l’offre publiée naît EN_ATTENTE et reste invisible du public', async () => {
    const res = await request(app).post('/api/entreprise/offres').set(auth(entrepriseA)).send(nouvelleOffre);
    expect(res.status).toBe(201);
    expect(res.body.offre).toMatchObject({ statut: 'EN_ATTENTE', prix: 12.5, categorie: { code: 'gastronomie' } });
    idOffre = res.body.offre.id;
    expect(await offresPubliques()).not.toContain(idOffre);
  });

  it('RG7 : un refus sans motif reçoit 422', async () => {
    const enAttente = await request(app).get('/api/admin/offres').set(auth(admin));
    expect(enAttente.body.elements.map((o: { id: string }) => o.id)).toContain(idOffre);

    const res = await request(app)
      .patch(`/api/admin/offres/${idOffre}/decision`)
      .set(auth(admin))
      .send({ decision: 'REFUSE' });
    expect(res.status).toBe(422);
  });

  it('valide l’offre, refuse une seconde décision (409) et l’offre apparaît pour les citoyens', async () => {
    const res = await request(app)
      .patch(`/api/admin/offres/${idOffre}/decision`)
      .set(auth(admin))
      .send({ decision: 'VALIDE' });
    expect(res.status).toBe(200);
    expect(res.body.offre.statut).toBe('VALIDE');
    expect(await prisma.journalModeration.count({ where: { offreId: idOffre, decision: 'VALIDE' } })).toBe(1);

    const doublon = await request(app)
      .patch(`/api/admin/offres/${idOffre}/decision`)
      .set(auth(admin))
      .send({ decision: 'REFUSE', motif: 'Changement d’avis' });
    expect(doublon.status).toBe(409);

    const publiques = await request(app).get('/api/citoyen/offres');
    const offre = publiques.body.elements.find((o: { id: string }) => o.id === idOffre);
    expect(offre).toMatchObject({ titre: nouvelleOffre.titre, entreprise: { nom: 'Fromagerie A' } });
    expect(offre).not.toHaveProperty('motifRefus');
  });

  it('RG16 : l’entreprise B ne peut ni modifier ni mettre en pause l’offre de A (403)', async () => {
    const modif = await request(app)
      .patch(`/api/entreprise/offres/${idOffre}`)
      .set(auth(entrepriseB))
      .send({ titre: 'Offre détournée' });
    expect(modif.status).toBe(403);
    const pause = await request(app)
      .patch(`/api/entreprise/offres/${idOffre}/statut`)
      .set(auth(entrepriseB))
      .send({ statut: 'EN_PAUSE' });
    expect(pause.status).toBe(403);
    expect((await prisma.offre.findUniqueOrThrow({ where: { id: idOffre } })).titre).toBe(nouvelleOffre.titre);
  });

  it('RG6 : changer le titre garde l’offre VALIDE, changer le prix la remet EN_ATTENTE', async () => {
    const titre = await request(app)
      .patch(`/api/entreprise/offres/${idOffre}`)
      .set(auth(entrepriseA))
      .send({ titre: 'Grande dégustation de fromages' });
    expect(titre.body.offre.statut).toBe('VALIDE');

    const memePrix = await request(app)
      .patch(`/api/entreprise/offres/${idOffre}`)
      .set(auth(entrepriseA))
      .send({ prix: 12.5 });
    expect(memePrix.body.offre.statut).toBe('VALIDE');

    const prix = await request(app)
      .patch(`/api/entreprise/offres/${idOffre}`)
      .set(auth(entrepriseA))
      .send({ prix: 15 });
    expect(prix.body.offre.statut).toBe('EN_ATTENTE');
    expect(await offresPubliques()).not.toContain(idOffre);

    await request(app).patch(`/api/admin/offres/${idOffre}/decision`).set(auth(admin)).send({ decision: 'VALIDE' });
    expect(await offresPubliques()).toContain(idOffre);
  });

  it('pause puis réactivation par l’entreprise', async () => {
    const pause = await request(app)
      .patch(`/api/entreprise/offres/${idOffre}/statut`)
      .set(auth(entrepriseA))
      .send({ statut: 'EN_PAUSE' });
    expect(pause.body.offre.statut).toBe('EN_PAUSE');
    expect(await offresPubliques()).not.toContain(idOffre);

    const reprise = await request(app)
      .patch(`/api/entreprise/offres/${idOffre}/statut`)
      .set(auth(entrepriseA))
      .send({ statut: 'VALIDE' });
    expect(reprise.body.offre.statut).toBe('VALIDE');

    const encore = await request(app)
      .patch(`/api/entreprise/offres/${idOffre}/statut`)
      .set(auth(entrepriseA))
      .send({ statut: 'VALIDE' });
    expect(encore.status).toBe(409);
  });

  it('une entreprise suspendue (motif obligatoire) disparaît du catalogue public', async () => {
    const sansMotif = await request(app)
      .patch(`/api/admin/entreprises/${idEntrepriseA}/decision`)
      .set(auth(admin))
      .send({ decision: 'SUSPENDU' });
    expect(sansMotif.status).toBe(422);

    const res = await request(app)
      .patch(`/api/admin/entreprises/${idEntrepriseA}/decision`)
      .set(auth(admin))
      .send({ decision: 'SUSPENDU', motif: 'Signalements répétés' });
    expect(res.body.entreprise.statut).toBe('SUSPENDU');
    expect(await offresPubliques()).not.toContain(idOffre);
  });

  it('RG15 : un compte entreprise n’accède pas à l’administration', async () => {
    const res = await request(app).get('/api/admin/offres').set(auth(entrepriseB));
    expect(res.status).toBe(403);
  });
});
