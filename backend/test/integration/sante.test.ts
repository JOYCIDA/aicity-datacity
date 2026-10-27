import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/prisma/client.js', () => ({
  prisma: { $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]) },
}));

import { createApp } from '../../src/app.js';

describe('GET /api/sante', () => {
  it('répond ok quand la base répond', async () => {
    const res = await request(createApp()).get('/api/sante');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ statut: 'ok', base: 'ok' });
  });

  it('renvoie 404 JSON pour une route inconnue', async () => {
    const res = await request(createApp()).get('/api/inconnue');
    expect(res.status).toBe(404);
    expect(res.body.erreur.code).toBe('INTROUVABLE');
  });
});
