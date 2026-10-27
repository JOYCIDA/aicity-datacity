import { env } from '../config/env.js';
import { creerDataGouvAdapter } from './datagouv.adapter.js';
import { creerOpenAgendaAdapter } from './openagenda.adapter.js';
import { creerParisOpenDataAdapter } from './parisopendata.adapter.js';
import type { CodeSource, SourceAdapter } from './source.adapter.js';

export { CODES_SOURCES, type CodeSource, type SourceAdapter } from './source.adapter.js';

/** Les adaptateurs configurés depuis l'environnement, dans l'ordre d'import nocturne. */
export const adaptateurs: Record<CodeSource, SourceAdapter<any>> = {
  parisopendata: creerParisOpenDataAdapter(),
  openagenda: creerOpenAgendaAdapter({ cle: env.OPENAGENDA_API_KEY, agendas: env.OPENAGENDA_AGENDAS }),
  datagouv: creerDataGouvAdapter({ dataset: env.DATAGOUV_DATASET, ressource: env.DATAGOUV_RESSOURCE }),
};
