import cron from 'node-cron';
import { env } from '../config/env.js';
import { executerImports } from './import.job.js';

/**
 * Planifie l'import nocturne (CRON_IMPORT, 3 h heure de Paris par défaut). À démarrer depuis
 * server.ts uniquement, dans un seul processus : en mode cluster, chaque instance planifierait
 * son propre import (le verrou par source ferait échouer les doublons, sans autre dégât).
 */
export function demarrerPlanification() {
  const tache = cron.schedule(env.CRON_IMPORT, () => executerImports(), {
    name: 'import-donnees-publiques',
    timezone: 'Europe/Paris',
    noOverlap: true,
  });
  console.log(`Import des données publiques planifié : « ${env.CRON_IMPORT} » (Europe/Paris)`);
  return tache;
}
