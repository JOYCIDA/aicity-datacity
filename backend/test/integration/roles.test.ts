import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { exigerRole, verifierJwt } from '../../src/middlewares/auth.middleware.js';
import { errorHandler } from '../../src/middlewares/error.middleware.js';
import { signerToken } from '../../src/utils/jwt.js';

// Mini application qui reproduit le montage prévu des espaces (RG15).
const app = express();
app.get('/citoyen', verifierJwt, exigerRole('CITOYEN'), (_req, res) => void res.json({ ok: true }));
app.get('/admin', verifierJwt, exigerRole('ADMIN'), (_req, res) => void res.json({ ok: true }));
app.get('/pro', verifierJwt, exigerRole('ENTREPRISE', 'ADMIN'), (_req, res) => void res.json({ ok: true }));
app.use(errorHandler);

const jeton = (role: 'CITOYEN' | 'ENTREPRISE' | 'ADMIN') => `Bearer ${signerToken({ id: 'u1', role })}`;

describe('contrôle d’accès par rôle', () => {
  it('401 sans jeton', async () => {
    expect((await request(app).get('/citoyen')).status).toBe(401);
  });

  it('403 si le rôle ne correspond pas', async () => {
    expect((await request(app).get('/admin').set('Authorization', jeton('CITOYEN'))).status).toBe(403);
    expect((await request(app).get('/citoyen').set('Authorization', jeton('ENTREPRISE'))).status).toBe(403);
  });

  it('200 si le rôle est autorisé', async () => {
    expect((await request(app).get('/citoyen').set('Authorization', jeton('CITOYEN'))).status).toBe(200);
    expect((await request(app).get('/pro').set('Authorization', jeton('ADMIN'))).status).toBe(200);
  });
});
