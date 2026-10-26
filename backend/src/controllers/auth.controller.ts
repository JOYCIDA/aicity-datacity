import type { RequestHandler } from 'express';
import { connexionSchema, inscriptionSchema } from '../schemas/auth.schema.js';
import * as authService from '../services/auth.service.js';
import { unauthorized } from '../utils/errors.js';

export const inscription: RequestHandler = async (req, res) => {
  const dto = inscriptionSchema.parse(req.body);
  res.status(201).json(await authService.inscrire(dto));
};

export const connexion: RequestHandler = async (req, res) => {
  const dto = connexionSchema.parse(req.body);
  res.json(await authService.connecter(dto));
};

export const moi: RequestHandler = async (req, res) => {
  if (!req.utilisateur) throw unauthorized();
  res.json({ utilisateur: await authService.moi(req.utilisateur.id) });
};
