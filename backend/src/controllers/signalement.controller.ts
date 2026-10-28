import type { RequestHandler } from 'express';
import {
  listeSignalementsSchema,
  signalementSchema,
  traiterSignalementSchema,
} from '../schemas/signalement.schema.js';
import * as signalementService from '../services/signalement.service.js';

/** Monté après `citoyenOuSession` : compte CITOYEN, session de borne ou session anonyme. */
export const signaler: RequestHandler = async (req, res) => {
  const dto = signalementSchema.parse(req.body);
  res.status(201).json({ signalement: await signalementService.signaler(dto) });
};

// Les deux suivantes sont montées derrière verifierJwt + exigerRole('ADMIN').

export const lister: RequestHandler = async (req, res) => {
  res.json(await signalementService.lister(listeSignalementsSchema.parse(req.query)));
};

export const traiter: RequestHandler<{ id: string }> = async (req, res) => {
  const { traite } = traiterSignalementSchema.parse(req.body ?? {});
  res.json({ signalement: await signalementService.marquer(req.params.id, traite) });
};
