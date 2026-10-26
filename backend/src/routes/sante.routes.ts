import { Router } from 'express';
import { prisma } from '../prisma/client.js';

export const santeRouter = Router();

santeRouter.get('/', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ statut: 'ok', base: 'ok' });
  } catch {
    res.status(503).json({ statut: 'degrade', base: 'indisponible' });
  }
});
