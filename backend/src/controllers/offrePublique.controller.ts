import type { RequestHandler } from 'express';
import { carteSchema, requeteLangueSchema } from '../schemas/citoyen.schema.js';
import * as offreService from '../services/offre.service.js';

export const lister: RequestHandler = async (req, res) => {
  const q = carteSchema.parse(req.query);
  res.json(await offreService.listerPubliques({ ...q, langue: q.langue ?? req.sessionBorne?.langue }));
};

export const detail: RequestHandler<{ id: string }> = async (req, res) => {
  const { langue } = requeteLangueSchema.parse(req.query);
  res.json({ offre: await offreService.detailPublique(req.params.id, langue ?? req.sessionBorne?.langue) });
};
