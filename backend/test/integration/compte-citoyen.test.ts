// UC10 et UC19 sur la base aicity_test : préférences, favoris, export des données, puis
// suppression du compte et vérification, ligne à ligne, qu'il n'en reste rien.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { baseDisponible, preparerBase, prismaTest } from '../helpers/base-reelle.js';

vi.mock('../../src/prisma/client.js', () => ({ prisma: prismaTest }));

const { createApp } = await import('../../src/app.js');
const { signerToken } = await import('../../src/utils/jwt.js');

const app = createApp();
const POSITION = { latitude: 48.8566, longitude: 2.3522 };
const MOT_DE_PASSE = 'motdepasse123';
const bearer = (jeton: string) => ({ Authorization: `Bearer ${jeton}` });

/** Lignes encore liées au compte, table par table (y compris la table de liaison des préférences). */
async function lignesDuCompte(utilisateurId: string, rechercheIds: string[]) {
  const [liaison] = await prismaTest.$queryRaw<{ n: bigint }[]>`
    SELECT count(*) AS n FROM "_CategorieToPreference" l
    JOIN "Preference" p ON p.id = l."B" WHERE p."utilisateurId" = ${utilisateurId}`;
  return {
    utilisateur: await prismaTest.utilisateur.count({ where: { id: utilisateurId } }),
    preference: await prismaTest.preference.count({ where: { utilisateurId } }),
    preferenceCategories: Number(liaison!.n),
    favoris: await prismaTest.favori.count({ where: { utilisateurId } }),
    recherches: await prismaTest.recherche.count({ where: { utilisateurId } }),
    recommandations: await prismaTest.recommandation.count({ where: { rechercheId: { in: rechercheIds } } }),
  };
}

describe.skipIf(!baseDisponible)('compte citoyen : préférences, favoris et RGPD (UC10, UC19)', () => {
  let jeton: string;
  let utilisateurId: string;
  const offres: Record<'expo' | 'concert' | 'pause', string> = { expo: '', concert: '', pause: '' };
  const rechercheIds: string[] = [];

  beforeAll(async () => {
    await preparerBase();
    const culture = await prismaTest.categorie.create({ data: { code: 'culture', libelleFr: 'Culture', libelleEn: 'Culture' } });
    await prismaTest.categorie.create({ data: { code: 'nature', libelleFr: 'Nature', libelleEn: 'Nature' } });
    const offre = (titre: string, statut: 'VALIDE' | 'EN_PAUSE', metres: number) =>
      prismaTest.offre.create({
        data: {
          titre,
          lieu: 'Marais',
          latitude: POSITION.latitude + metres / 111_195,
          longitude: POSITION.longitude,
          debut: new Date(Date.now() - 86_400_000),
          fin: new Date(Date.now() + 30 * 86_400_000),
          dureeMinutes: 30,
          gratuit: true,
          statut,
          source: 'PARIS_OPEN_DATA',
          idExterne: titre,
          categorieId: culture.id,
        },
      });
    offres.expo = (await offre('Expo', 'VALIDE', 200)).id;
    offres.concert = (await offre('Concert', 'VALIDE', 400)).id;
    offres.pause = (await offre('En pause', 'EN_PAUSE', 300)).id;

    const res = await request(app)
      .post('/api/auth/inscription')
      .send({ role: 'CITOYEN', email: 'claire@aicity.test', motDePasse: MOT_DE_PASSE });
    jeton = res.body.token;
    utilisateurId = res.body.utilisateur.id;
  }, 60_000);

  afterAll(() => prismaTest.$disconnect());

  it('préférences : valeurs par défaut, puis PUT remplace l’ensemble', async () => {
    const vide = await request(app).get('/api/citoyen/preferences').set(bearer(jeton));
    expect(vide.status).toBe(200);
    expect(vide.body.preferences).toEqual({ categories: [], budgetMax: null, langue: 'FR' });

    const put = await request(app)
      .put('/api/citoyen/preferences')
      .set(bearer(jeton))
      .send({ categories: ['nature', 'culture', 'culture'], budgetMax: 12.5, langue: 'EN' });
    expect(put.status).toBe(200);
    expect(put.body.preferences).toEqual({ categories: ['culture', 'nature'], budgetMax: 12.5, langue: 'EN' });

    // PUT remplace : une catégorie retirée disparaît.
    const remplace = await request(app)
      .put('/api/citoyen/preferences')
      .set(bearer(jeton))
      .send({ categories: ['culture'], budgetMax: null });
    expect(remplace.body.preferences).toEqual({ categories: ['culture'], budgetMax: null, langue: 'EN' });

    const invalide = await request(app)
      .put('/api/citoyen/preferences')
      .set(bearer(jeton))
      .send({ categories: ['inconnue'], budgetMax: 10 });
    expect(invalide.status).toBe(422);
  });

  it('favoris : ajout idempotent, offre invisible refusée, compteur anonyme du jour (RG19)', async () => {
    const ajout = await request(app).post('/api/citoyen/favoris').set(bearer(jeton)).send({ offreId: offres.expo });
    expect(ajout.status).toBe(201);
    expect(ajout.body.favori).toMatchObject({ disponible: true, offre: { id: offres.expo, titre: 'Expo' } });
    expect(ajout.body.favori.offre).not.toHaveProperty('statut');

    const encore = await request(app).post('/api/citoyen/favoris').set(bearer(jeton)).send({ offreId: offres.expo });
    expect(encore.status).toBe(200);

    expect(
      (await request(app).post('/api/citoyen/favoris').set(bearer(jeton)).send({ offreId: offres.pause })).status,
    ).toBe(404);
    expect((await request(app).post('/api/citoyen/favoris').set(bearer(jeton)).send({ offreId: 'x' })).status).toBe(422);

    await request(app).post('/api/citoyen/favoris').set(bearer(jeton)).send({ offreId: offres.concert });
    const liste = await request(app).get('/api/citoyen/favoris').set(bearer(jeton));
    expect(liste.body.favoris.map((f: { offre: { titre: string } }) => f.offre.titre)).toEqual(['Concert', 'Expo']);

    // Compté une seule fois malgré le double ajout.
    const stat = await prismaTest.statOffreJour.findMany({ where: { offreId: offres.expo } });
    expect(stat).toEqual([expect.objectContaining({ favoris: 1 })]);
  });

  it('favoris : une offre mise en pause reste dans la liste, marquée indisponible ; DELETE est idempotent', async () => {
    await prismaTest.offre.update({ where: { id: offres.concert }, data: { statut: 'EN_PAUSE' } });
    const liste = await request(app).get('/api/citoyen/favoris').set(bearer(jeton));
    expect(liste.body.favoris).toEqual([
      expect.objectContaining({ disponible: false, offre: expect.objectContaining({ id: offres.concert }) }),
      expect.objectContaining({ disponible: true, offre: expect.objectContaining({ id: offres.expo }) }),
    ]);

    expect((await request(app).delete(`/api/citoyen/favoris/${offres.concert}`).set(bearer(jeton))).status).toBe(204);
    expect((await request(app).delete(`/api/citoyen/favoris/${offres.concert}`).set(bearer(jeton))).status).toBe(204);
    expect((await request(app).get('/api/citoyen/favoris').set(bearer(jeton))).body.favoris).toHaveLength(1);
  });

  it('une recommandation compte chaque offre proposée dans les statistiques du jour (RG19)', async () => {
    const res = await request(app)
      .post('/api/citoyen/recommandations')
      .set(bearer(jeton))
      .send({ ...POSITION, tempsLibreMinutes: 60 });
    expect(res.status).toBe(200);
    expect(res.body.resultats.map((r: { offre: { id: string } }) => r.offre.id)).toEqual([offres.expo]);
    rechercheIds.push(res.body.rechercheId);
    const stat = await prismaTest.statOffreJour.findMany({ where: { offreId: offres.expo } });
    expect(stat).toEqual([expect.objectContaining({ recommandations: 1, favoris: 1 })]);
  });

  it('GET /mes-donnees renvoie tout ce qui concerne le compte, sans le mot de passe', async () => {
    const res = await request(app).get('/api/citoyen/mes-donnees').set(bearer(jeton));
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="aicity-mes-donnees.json"/);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body).toMatchObject({
      compte: { id: utilisateurId, email: 'claire@aicity.test', role: 'CITOYEN', langue: 'EN' },
      preferences: { categories: ['culture'], budgetMax: null },
      favoris: [{ offre: { id: offres.expo, titre: 'Expo' } }],
      recherches: [
        {
          id: rechercheIds[0],
          tempsLibreMinutes: 60,
          recommandations: [{ rang: 1, offre: { id: offres.expo, titre: 'Expo' } }],
        },
      ],
    });
    expect(JSON.stringify(res.body)).not.toMatch(/motDePasse|\$2[aby]\$/);
    // La position n'a jamais été enregistrée, elle ne peut donc pas figurer dans l'export.
    expect(JSON.stringify(res.body.recherches)).not.toMatch(/latitude|longitude/);
  });

  it('DELETE /compte exige le bon mot de passe', async () => {
    const sansMotDePasse = await request(app).delete('/api/citoyen/compte').set(bearer(jeton));
    expect(sansMotDePasse.status).toBe(422);
    const faux = await request(app).delete('/api/citoyen/compte').set(bearer(jeton)).send({ motDePasse: 'mauvais' });
    expect(faux.status).toBe(403);
    expect(await prismaTest.utilisateur.count({ where: { id: utilisateurId } })).toBe(1);
  });

  it('après DELETE /compte, plus aucune ligne liée à l’utilisateur n’existe', async () => {
    const avant = await lignesDuCompte(utilisateurId, rechercheIds);
    // Le test n'a de sens que si chaque table contenait bien quelque chose.
    expect(Object.values(avant).every((n) => n > 0)).toBe(true);

    const res = await request(app).delete('/api/citoyen/compte').set(bearer(jeton)).send({ motDePasse: MOT_DE_PASSE });
    expect(res.status).toBe(204);

    expect(await lignesDuCompte(utilisateurId, rechercheIds)).toEqual({
      utilisateur: 0,
      preference: 0,
      preferenceCategories: 0,
      favoris: 0,
      recherches: 0,
      recommandations: 0,
    });
    // Rien ne mentionne plus l'utilisateur, où que ce soit dans la base.
    const [trace] = await prismaTest.$queryRaw<{ n: bigint }[]>`
      SELECT (SELECT count(*) FROM "Utilisateur" WHERE email = 'claire@aicity.test')
           + (SELECT count(*) FROM "Recherche" WHERE "utilisateurId" = ${utilisateurId}) AS n`;
    expect(Number(trace!.n)).toBe(0);
  });

  it('les compteurs anonymes et les offres survivent ; l’ancien jeton reçoit 401 ; l’e-mail est libéré', async () => {
    expect(await prismaTest.offre.count()).toBe(3);
    const stat = await prismaTest.statOffreJour.findMany({ where: { offreId: offres.expo } });
    expect(stat).toEqual([expect.objectContaining({ recommandations: 1, favoris: 1 })]);

    for (const appel of [
      request(app).get('/api/citoyen/preferences').set(bearer(jeton)),
      request(app).get('/api/citoyen/favoris').set(bearer(jeton)),
      request(app).get('/api/citoyen/mes-donnees').set(bearer(jeton)),
      request(app).post('/api/citoyen/recommandations').set(bearer(jeton)).send({ ...POSITION, tempsLibreMinutes: 60 }),
    ]) {
      const res = await appel;
      expect(res.status).toBe(401);
      expect(res.body.erreur.message).toBe('Compte supprimé');
    }
    expect(await prismaTest.recherche.count()).toBe(0);

    const reinscription = await request(app)
      .post('/api/auth/inscription')
      .send({ role: 'CITOYEN', email: 'claire@aicity.test', motDePasse: MOT_DE_PASSE });
    expect(reinscription.status).toBe(201);
  });

  it('ces routes sont réservées au compte citoyen', async () => {
    const entreprise = bearer(signerToken({ id: 'e', role: 'ENTREPRISE' }));
    expect((await request(app).get('/api/citoyen/preferences').set(entreprise)).status).toBe(403);
    expect((await request(app).get('/api/citoyen/mes-donnees')).status).toBe(401);
  });
});
