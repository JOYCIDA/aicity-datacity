import { describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

// Le limiteur est inactif en test : on simule un environnement de développement.
vi.mock('../../src/config/env.js', () => ({ env: { NODE_ENV: 'development' } }));
const { limiter } = await import('../../src/middlewares/rateLimit.middleware.js');

describe('limiteur par adresse IP', () => {
  it('laisse passer jusqu’à la limite configurée, puis répond 429', async () => {
    const app = express();
    app.post('/', limiter(3, 15), (_req, res) => void res.status(201).json({}));
    for (let i = 0; i < 3; i++) expect((await request(app).post('/')).status).toBe(201);
    const refus = await request(app).post('/');
    expect(refus.status).toBe(429);
    expect(refus.body.erreur.code).toBe('TROP_DE_REQUETES');
  });

  it('compte chaque adresse séparément derrière un proxy de confiance', async () => {
    const app = express();
    app.set('trust proxy', 1);
    app.post('/', limiter(1, 15), (_req, res) => void res.status(201).json({}));
    const depuis = (ip: string) => request(app).post('/').set('X-Forwarded-For', ip);
    expect((await depuis('203.0.113.1')).status).toBe(201);
    expect((await depuis('203.0.113.2')).status).toBe(201); // une autre IP n'est pas bloquée
    expect((await depuis('203.0.113.1')).status).toBe(429);
  });
});
