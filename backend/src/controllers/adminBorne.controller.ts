import type { RequestHandler } from 'express';
import { creerBorneSchema, modifierBorneSchema } from '../schemas/admin.schema.js';
import * as borneService from '../services/borne.service.js';

// Montées derrière verifierJwt + exigerRole('ADMIN').

/** RG17 : la clé n'est renvoyée qu'ici ; elle ne pourra plus être relue. */
export const creer: RequestHandler = async (req, res) => {
  const dto = creerBorneSchema.parse(req.body);
  res.set('Cache-Control', 'no-store');
  res.status(201).json(await borneService.creer(dto));
};

export const lister: RequestHandler = async (_req, res) => {
  res.json({ bornes: await borneService.lister() });
};

/** UC16 : état des bornes (dernier signal), les bornes hors ligne en tête. */
export const supervision: RequestHandler = async (_req, res) => {
  res.json(await borneService.supervision());
};

export const modifier: RequestHandler<{ id: string }> = async (req, res) => {
  const dto = modifierBorneSchema.parse(req.body);
  res.json({ borne: await borneService.modifier(req.params.id, dto) });
};

export const renouvelerCle: RequestHandler<{ id: string }> = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(await borneService.renouvelerCle(req.params.id));
};
