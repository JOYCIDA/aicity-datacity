import type { RequestHandler } from 'express';
import { ouvrirSessionSchema } from '../schemas/citoyen.schema.js';
import * as sessionService from '../services/session.service.js';
import { forbidden } from '../utils/errors.js';

/** Monté après `exigerBorne` : req.borne est garanti. */
export const ouvrir: RequestHandler = async (req, res) => {
  const { langue } = ouvrirSessionSchema.parse(req.body ?? {});
  const borne = req.borne!;
  const { session, jeton } = await sessionService.ouvrir(borne.id, langue);
  res.status(201).json({
    session,
    jeton,
    borne: { nom: borne.nom, emplacement: borne.emplacement },
  });
};

/** Mobile sans compte : jeton à présenter ensuite sur les routes citoyen (recommandations, signalement). */
export const ouvrirAnonyme: RequestHandler = (req, res) => {
  const { langue } = ouvrirSessionSchema.parse(req.body ?? {});
  const { jeton, expireLe } = sessionService.ouvrirAnonyme();
  res.status(201).json({ jeton, expireLe, langue });
};

/** Signal de vie (chaque minute) : `exigerBorne` a déjà mis à jour `dernierPing`. */
export const signal: RequestHandler = (_req, res) => {
  res.status(204).end();
};

// Les routes suivantes sont montées après `exigerSession` : la session est déjà prolongée.

const sessionDeLaRequete = (req: Parameters<RequestHandler<{ id: string }>>[0]) => {
  if (req.params.id !== req.sessionBorne!.id) throw forbidden('Cette session appartient à un autre jeton');
  return req.sessionBorne!;
};

/** État de la session ; l'appel compte comme une activité (à utiliser quand l'usager touche l'écran). */
export const etat: RequestHandler<{ id: string }> = async (req, res) => {
  const { id, langue, expireLe } = sessionDeLaRequete(req);
  res.json({ session: { id, langue, expireLe } });
};

/** Fin de session à la demande de l'usager : tout ce qui la concerne est supprimé. */
export const terminer: RequestHandler<{ id: string }> = async (req, res) => {
  await sessionService.terminer(sessionDeLaRequete(req).id);
  res.status(204).end();
};
