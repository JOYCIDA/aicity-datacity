import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { creerFauxPrisma } from '../helpers/fake-prisma.js';

const faux = vi.hoisted(() => ({ db: null as any }));
vi.mock('../../src/prisma/client.js', () => ({
  get prisma() {
    return faux.db;
  },
}));

import { createApp } from '../../src/app.js';

const app = createApp();
const citoyen = { role: 'CITOYEN', email: 'Awa@Example.com', motDePasse: 'motdepasse123' };

beforeEach(() => {
  faux.db = creerFauxPrisma();
});

describe('POST /api/auth/inscription', () => {
  it('crée un citoyen, normalise l’e-mail et ne renvoie jamais le hash', async () => {
    const res = await request(app).post('/api/auth/inscription').send(citoyen);
    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.utilisateur).toMatchObject({ email: 'awa@example.com', role: 'CITOYEN', langue: 'FR' });
    expect(JSON.stringify(res.body)).not.toContain('motDePasse');
    expect(faux.db.utilisateurs[0].motDePasseHash).not.toBe(citoyen.motDePasse);
  });

  it('crée une entreprise au statut EN_ATTENTE (RG5, RG8)', async () => {
    const res = await request(app)
      .post('/api/auth/inscription')
      .send({
        role: 'ENTREPRISE',
        email: 'pro@example.com',
        motDePasse: 'motdepasse123',
        entreprise: { nom: 'Café Lumière', typeActivite: 'Café', adresse: '12 rue de Rivoli, Paris' },
      });
    expect(res.status).toBe(201);
    expect(faux.db.entreprises[0].statut).toBe('EN_ATTENTE');
  });

  it('refuse l’inscription d’un ADMIN', async () => {
    const res = await request(app)
      .post('/api/auth/inscription')
      .send({ role: 'ADMIN', email: 'a@example.com', motDePasse: 'motdepasse123' });
    expect(res.status).toBe(422);
  });

  it('renvoie 409 si l’e-mail existe déjà', async () => {
    await request(app).post('/api/auth/inscription').send(citoyen);
    const res = await request(app).post('/api/auth/inscription').send(citoyen);
    expect(res.status).toBe(409);
  });

  it('renvoie 422 pour un mot de passe trop court ou un e-mail invalide', async () => {
    const court = await request(app).post('/api/auth/inscription').send({ ...citoyen, motDePasse: '123' });
    const mauvais = await request(app).post('/api/auth/inscription').send({ ...citoyen, email: 'pas-un-email' });
    expect(court.status).toBe(422);
    expect(mauvais.status).toBe(422);
  });
});

describe('POST /api/auth/connexion', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/inscription').send(citoyen);
  });

  it('connecte avec les bons identifiants (e-mail insensible à la casse)', async () => {
    const res = await request(app)
      .post('/api/auth/connexion')
      .send({ email: 'AWA@example.com', motDePasse: citoyen.motDePasse });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('renvoie le même 401 générique pour un mauvais mot de passe et un e-mail inconnu', async () => {
    const a = await request(app).post('/api/auth/connexion').send({ email: 'awa@example.com', motDePasse: 'faux-faux-faux' });
    const b = await request(app).post('/api/auth/connexion').send({ email: 'inconnu@example.com', motDePasse: 'faux-faux-faux' });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body).toEqual(b.body);
  });
});

describe('GET /api/auth/moi', () => {
  it('renvoie le profil avec un jeton valide', async () => {
    const ins = await request(app).post('/api/auth/inscription').send(citoyen);
    const res = await request(app).get('/api/auth/moi').set('Authorization', `Bearer ${ins.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.utilisateur.email).toBe('awa@example.com');
    expect(res.body.utilisateur.motDePasseHash).toBeUndefined();
  });

  it('renvoie 401 sans jeton ou avec un jeton invalide', async () => {
    expect((await request(app).get('/api/auth/moi')).status).toBe(401);
    const res = await request(app).get('/api/auth/moi').set('Authorization', 'Bearer abc');
    expect(res.status).toBe(401);
  });
});
