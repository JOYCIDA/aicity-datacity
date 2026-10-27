import type { RequestHandler } from 'express';
import {
  creerOffreSchema,
  listeOffresEntrepriseSchema,
  modifierOffreSchema,
  statutOffreSchema,
} from '../schemas/offre.schema.js';
import * as offreService from '../services/offre.service.js';

// Montées derrière verifierJwt + exigerRole('ENTREPRISE'). La propriété de l'offre (RG16)
// est vérifiée dans le service, pas ici.

export const creer: RequestHandler = async (req, res) => {
  const dto = creerOffreSchema.parse(req.body);
  res.status(201).json({ offre: await offreService.creer(req.utilisateur!.id, dto) });
};

export const lister: RequestHandler = async (req, res) => {
  const q = listeOffresEntrepriseSchema.parse(req.query);
  res.json(await offreService.listerMiennes(req.utilisateur!.id, q));
};

export const detail: RequestHandler<{ id: string }> = async (req, res) => {
  res.json({ offre: await offreService.detailMienne(req.utilisateur!.id, req.params.id) });
};

export const modifier: RequestHandler<{ id: string }> = async (req, res) => {
  const dto = modifierOffreSchema.parse(req.body);
  res.json({ offre: await offreService.modifier(req.utilisateur!.id, req.params.id, dto) });
};

export const changerStatut: RequestHandler<{ id: string }> = async (req, res) => {
  const dto = statutOffreSchema.parse(req.body);
  res.json({ offre: await offreService.changerStatut(req.utilisateur!.id, req.params.id, dto) });
};
