import type { RequestHandler } from 'express';
import { statistiquesSchema } from '../schemas/entreprise.schema.js';
import * as statsService from '../services/stats.service.js';

// Montée derrière verifierJwt + exigerRole('ENTREPRISE') : seulement les offres du compte (RG16).

export const statistiques: RequestHandler = async (req, res) => {
  const { jours } = statistiquesSchema.parse(req.query);
  res.json(await statsService.statistiquesEntreprise(req.utilisateur!.id, jours));
};
