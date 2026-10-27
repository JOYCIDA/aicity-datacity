import type { RequestHandler } from 'express';
import {
  decisionEntrepriseSchema,
  decisionOffreSchema,
  listeEntreprisesSchema,
  listeOffresModerationSchema,
} from '../schemas/admin.schema.js';
import * as moderationService from '../services/moderation.service.js';

// Montées derrière verifierJwt + exigerRole('ADMIN').

export const listerEntreprises: RequestHandler = async (req, res) => {
  const q = listeEntreprisesSchema.parse(req.query);
  res.json(await moderationService.listerEntreprises(q));
};

export const detailEntreprise: RequestHandler<{ id: string }> = async (req, res) => {
  res.json({ entreprise: await moderationService.detailEntreprise(req.params.id) });
};

export const justificatif: RequestHandler<{ id: string }> = async (req, res) => {
  const chemin = await moderationService.justificatif(req.params.id);
  // Pièce d'identité : jamais mise en cache, téléchargée plutôt qu'affichée.
  res.set('Cache-Control', 'no-store');
  res.download(chemin);
};

export const deciderEntreprise: RequestHandler<{ id: string }> = async (req, res) => {
  const dto = decisionEntrepriseSchema.parse(req.body);
  res.json({
    entreprise: await moderationService.deciderEntreprise(req.utilisateur!.id, req.params.id, dto),
  });
};

export const listerOffres: RequestHandler = async (req, res) => {
  const q = listeOffresModerationSchema.parse(req.query);
  res.json(await moderationService.listerOffres(q));
};

export const deciderOffre: RequestHandler<{ id: string }> = async (req, res) => {
  const dto = decisionOffreSchema.parse(req.body);
  res.json({ offre: await moderationService.deciderOffre(req.utilisateur!.id, req.params.id, dto) });
};
