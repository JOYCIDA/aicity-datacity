import type { RequestHandler } from 'express';
import * as borneService from '../services/borne.service.js';
import { forbidden, unauthorized } from '../utils/errors.js';

/** Exige l'en-tête `X-Borne-Key` d'une borne connue (401) et non désactivée (403). */
export const exigerBorne: RequestHandler = async (req, _res, next) => {
  const cle = req.get('X-Borne-Key')?.trim();
  if (!cle) throw unauthorized('Clé de borne manquante (en-tête X-Borne-Key)');

  const borne = await borneService.authentifier(cle);
  if (!borne) throw unauthorized('Clé de borne invalide');
  if (borne.statut === 'DESACTIVEE') throw forbidden('Borne désactivée');

  req.borne = {
    id: borne.id,
    nom: borne.nom,
    emplacement: borne.emplacement,
    latitude: borne.latitude,
    longitude: borne.longitude,
  };
  next();
};
