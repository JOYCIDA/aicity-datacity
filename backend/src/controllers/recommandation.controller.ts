import type { RequestHandler } from 'express';
import { clientInterpretation } from '../clients/llm.client.js';
import { QUESTIONS } from '../config/questions.js';
import {
  interpretationSchema,
  recommandationMobileSchema,
  recommandationSessionSchema,
} from '../schemas/citoyen.schema.js';
import * as recommandationService from '../services/recommandation.service.js';

export const questions: RequestHandler = (_req, res) => {
  res.json({ questions: QUESTIONS });
};

/**
 * Monté après `citoyenOuSession`. Mode borne : position de la borne (RG2) et langue de la
 * session par défaut. Mode mobile : jeton CITOYEN, position fournie dans la requête.
 */
export const recommander: RequestHandler = async (req, res) => {
  const session = req.sessionBorne;
  if (session) {
    const criteres = recommandationSessionSchema.parse(req.body);
    const dto = { ...criteres, ...session.position, langue: criteres.langue ?? session.langue };
    res.json(await recommandationService.recommander(dto, { sessionId: session.id }));
    return;
  }
  const criteres = recommandationMobileSchema.parse(req.body);
  const dto = { ...criteres, langue: criteres.langue ?? 'FR' };
  res.json(await recommandationService.recommander(dto, { utilisateurId: req.utilisateur!.id }));
};

/** RG3 : le texte n'est jamais enregistré ; seule l'interprétation est renvoyée. */
export const interpreter: RequestHandler = async (req, res) => {
  const { texte } = interpretationSchema.parse(req.body);
  res.json({ interpretation: await clientInterpretation.interpreter(texte) });
};
