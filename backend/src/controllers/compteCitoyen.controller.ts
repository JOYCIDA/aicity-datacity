import type { RequestHandler } from 'express';
import { favoriSchema, preferencesSchema, supprimerCompteSchema } from '../schemas/citoyen.schema.js';
import * as compteService from '../services/compteCitoyen.service.js';

// Montées derrière verifierJwt + exigerRole('CITOYEN') : tout porte sur le compte connecté.

export const preferences: RequestHandler = async (req, res) => {
  res.json({ preferences: await compteService.preferences(req.utilisateur!.id) });
};

export const enregistrerPreferences: RequestHandler = async (req, res) => {
  const dto = preferencesSchema.parse(req.body);
  res.json({ preferences: await compteService.enregistrerPreferences(req.utilisateur!.id, dto) });
};

export const favoris: RequestHandler = async (req, res) => {
  res.json({ favoris: await compteService.favoris(req.utilisateur!.id) });
};

/** 201 au premier ajout, 200 si l'offre était déjà en favori. */
export const ajouterFavori: RequestHandler = async (req, res) => {
  const { offreId } = favoriSchema.parse(req.body);
  const { cree, favori } = await compteService.ajouterFavori(req.utilisateur!.id, offreId);
  res.status(cree ? 201 : 200).json({ favori });
};

export const retirerFavori: RequestHandler<{ offreId: string }> = async (req, res) => {
  await compteService.retirerFavori(req.utilisateur!.id, req.params.offreId);
  res.status(204).end();
};

/** UC19 : export de toutes les données du compte, à enregistrer tel quel. */
export const mesDonnees: RequestHandler = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.attachment('aicity-mes-donnees.json');
  res.json(await compteService.mesDonnees(req.utilisateur!.id));
};

export const supprimerCompte: RequestHandler = async (req, res) => {
  const { motDePasse } = supprimerCompteSchema.parse(req.body ?? {});
  await compteService.supprimerCompte(req.utilisateur!.id, motDePasse);
  res.status(204).end();
};
