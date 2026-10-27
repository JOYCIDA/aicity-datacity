import { unlink } from 'node:fs/promises';
import path from 'node:path';
import type { RequestHandler } from 'express';
import { SOUS_DOSSIER_JUSTIFICATIFS } from '../middlewares/upload.middleware.js';
import * as entrepriseService from '../services/entreprise.service.js';

/** À monter après `televerserJustificatif`, qui garantit la présence et le type de req.file. */
export const justificatif: RequestHandler = async (req, res) => {
  const fichier = req.file!;
  const relatif = path.posix.join(SOUS_DOSSIER_JUSTIFICATIFS, fichier.filename);
  try {
    const entreprise = await entrepriseService.enregistrerJustificatif(req.utilisateur!.id, relatif);
    res.status(201).json({ entreprise });
  } catch (err) {
    // Pas de fichier orphelin si l'enregistrement échoue.
    await unlink(fichier.path).catch(() => {});
    throw err;
  }
};
