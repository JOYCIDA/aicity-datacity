import type { RequestHandler } from 'express';
import { carteSchema } from '../schemas/citoyen.schema.js';
import * as offreService from '../services/offre.service.js';

export const lister: RequestHandler = async (req, res) => {
  const q = carteSchema.parse(req.query);
  res.json(await offreService.listerPubliques(q));
};

export const detail: RequestHandler<{ id: string }> = async (req, res) => {
  res.json({ offre: await offreService.detailPublique(req.params.id) });
};
