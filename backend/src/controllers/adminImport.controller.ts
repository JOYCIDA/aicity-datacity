import type { RequestHandler } from 'express';
import { adaptateurs } from '../adapters/index.js';
import { listeImportsSchema, sourceImportSchema } from '../schemas/admin.schema.js';
import * as importService from '../services/import.service.js';
import { conflict } from '../utils/errors.js';

// Montées derrière verifierJwt + exigerRole('ADMIN').

/** UC20 : lance l'import et répond 202 tout de suite ; le rapport se suit via GET /imports. */
export const lancer: RequestHandler = async (req, res) => {
  const { source } = sourceImportSchema.parse(req.params);
  const adapter = adaptateurs[source];
  const manque = adapter.configurationManquante();
  if (manque) throw conflict(`Source ${source} non configurée : ${manque}`);

  const { rapport } = await importService.demarrerImport(adapter);
  res.status(202).json({ rapport });
};

export const lister: RequestHandler = async (req, res) => {
  const q = listeImportsSchema.parse(req.query);
  res.json(await importService.listerRapports(q));
};
