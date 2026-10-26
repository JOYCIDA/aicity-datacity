import type { RequestHandler } from 'express';
import { paginationSchema } from '../schemas/offre.schema.js';
import * as offreService from '../services/offre.service.js';

export const lister: RequestHandler = async (req, res) => {
  const q = paginationSchema.parse(req.query);
  res.json(await offreService.listerPubliques(q));
};
