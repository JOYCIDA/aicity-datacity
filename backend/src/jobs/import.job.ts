import { adaptateurs, type SourceAdapter } from '../adapters/index.js';
import { importer } from '../services/import.service.js';
import { executerTraduction } from './traduction.job.js';

/**
 * Import de toutes les sources configurées, l'une après l'autre (UC21). Chaque source est
 * isolée : une panne, un import déjà en cours ou une source non configurée n'arrête pas les autres.
 */
export async function executerImports(sources: SourceAdapter[] = Object.values(adaptateurs)) {
  const bilan: string[] = [];
  for (const adapter of sources) {
    const manque = adapter.configurationManquante();
    if (manque) {
      bilan.push(`${adapter.code} : ignorée (${manque})`);
      continue;
    }
    try {
      const r = await importer(adapter);
      bilan.push(
        r.statut === 'TERMINE'
          ? `${adapter.code} : ${r.nbCrees} créées, ${r.nbMisAJour} mises à jour, ${r.nbRejetes} rejetées`
          : `${adapter.code} : échec (${r.message})`,
      );
    } catch (err) {
      bilan.push(`${adapter.code} : non lancée (${err instanceof Error ? err.message : err})`);
    }
  }
  console.log(`[import] ${bilan.join(' | ')}`);
  await executerTraduction(); // anglais des offres nouvelles ou modifiées, si un traducteur est configuré
  return bilan;
}
