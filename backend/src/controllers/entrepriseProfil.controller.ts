import type { RequestHandler } from 'express';
import { modifierProfilSchema } from '../schemas/entreprise.schema.js';
import * as entrepriseService from '../services/entreprise.service.js';

// Montées derrière verifierJwt + exigerRole('ENTREPRISE') : req.utilisateur est garanti.

export const profil: RequestHandler = async (req, res) => {
  res.json({ entreprise: await entrepriseService.profil(req.utilisateur!.id) });
};

export const modifierProfil: RequestHandler = async (req, res) => {
  const dto = modifierProfilSchema.parse(req.body);
  res.json({ entreprise: await entrepriseService.modifierProfil(req.utilisateur!.id, dto) });
};
