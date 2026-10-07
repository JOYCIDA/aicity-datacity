import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { db } from './prisma/db.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'AiCity backend opérationnel' });
});

// Exemple d'utilisation de Prisma (à adapter selon ton schéma)
app.get('/api/test-db', async (req: Request, res: Response) => {
  try {
    // Ici tu pourras faire des requêtes une fois le schéma défini
    res.json({ message: 'Connexion Prisma prête' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur base de données' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});