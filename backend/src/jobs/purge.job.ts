import cron from 'node-cron';
import * as borneService from '../services/borne.service.js';
import * as sessionService from '../services/session.service.js';

/** RG1 : supprime les sessions de borne échues (avec leurs recherches, en cascade). */
export async function purgerSessions() {
  try {
    const n = await sessionService.purger();
    if (n > 0) console.log(`[purge] ${n} session(s) de borne supprimée(s)`);
    return n;
  } catch (err) {
    console.error('[purge] échec :', err instanceof Error ? err.message : err);
    return 0;
  }
}

/** Supervision : une borne active restée silencieuse passe HORS_LIGNE. */
export async function surveillerBornes() {
  try {
    const n = await borneService.marquerSilencieuses();
    if (n > 0) console.warn(`[supervision] ${n} borne(s) passée(s) hors ligne`);
    return n;
  } catch (err) {
    console.error('[supervision] échec :', err instanceof Error ? err.message : err);
    return 0;
  }
}

/** Chaque minute. Sans risque en mode cluster : supprimer ou marquer deux fois ne change rien. */
export function demarrerPurge() {
  return cron.schedule(
    '* * * * *',
    async () => {
      await purgerSessions();
      await surveillerBornes();
    },
    { name: 'purge-sessions', noOverlap: true },
  );
}
