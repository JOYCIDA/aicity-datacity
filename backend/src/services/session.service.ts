// UC1 : sessions anonymes ouvertes depuis une borne.
// RG1 : chaque appel repousse l'échéance de 60 s (inactivité glissante), sans que la session
// dure plus de 10 minutes au total. Une session échue est supprimée, avec ses recherches et
// recommandations (suppression en cascade).
import type { Langue } from '../generated/prisma/client.js';
import { prisma } from '../prisma/client.js';
import { signerJetonSession } from '../utils/jwt.js';

export const INACTIVITE_MS = 60_000;
export const DUREE_MAX_MS = 10 * 60_000;

const echeance = (debutLe: Date, maintenant: Date) =>
  new Date(Math.min(maintenant.getTime() + INACTIVITE_MS, debutLe.getTime() + DUREE_MAX_MS));

export async function ouvrir(borneId: string, langue: Langue, maintenant = new Date()) {
  const session = await prisma.sessionBorne.create({
    // debutLe fixé par l'application, pas par la base : une seule horloge pour RG1.
    data: { borneId, langue, debutLe: maintenant, expireLe: echeance(maintenant, maintenant) },
    select: { id: true, langue: true, debutLe: true, expireLe: true },
  });
  // Le jeton survit une minute à la durée maximale : c'est la base qui tranche l'échéance, et
  // une session échue est ainsi toujours supprimée par l'appel qui la découvre.
  return { session, jeton: signerJetonSession(session.id, (DUREE_MAX_MS + 60_000) / 1000) };
}

/**
 * Valide la session et repousse son échéance. Renvoie null (après l'avoir supprimée) si elle
 * est échue, a atteint sa durée maximale, ou si sa borne a été désactivée.
 */
export async function prolonger(sessionId: string, maintenant = new Date()) {
  const session = await prisma.sessionBorne.findUnique({
    where: { id: sessionId },
    include: { borne: { select: { latitude: true, longitude: true, statut: true } } },
  });
  if (!session) return null;

  const nouvelle = echeance(session.debutLe, maintenant);
  const vivante = session.expireLe > maintenant && nouvelle > maintenant && session.borne.statut !== 'DESACTIVEE';
  // Mise à jour conditionnelle : deux appels simultanés ne peuvent pas ranimer une session échue.
  const { count } = vivante
    ? await prisma.sessionBorne.updateMany({
        where: { id: sessionId, expireLe: { gt: maintenant } },
        data: { expireLe: nouvelle },
      })
    : { count: 0 };
  if (count === 0) {
    await terminer(sessionId);
    return null;
  }
  return {
    id: session.id,
    borneId: session.borneId,
    langue: session.langue,
    expireLe: nouvelle,
    position: { latitude: session.borne.latitude, longitude: session.borne.longitude },
  };
}

/** Supprime la session ; recherches et recommandations partent en cascade. */
export async function terminer(sessionId: string) {
  const { count } = await prisma.sessionBorne.deleteMany({ where: { id: sessionId } });
  return count > 0;
}

/** Supprime toutes les sessions échues (tâche de purge, chaque minute). */
export async function purger(maintenant = new Date()) {
  const { count } = await prisma.sessionBorne.deleteMany({ where: { expireLe: { lte: maintenant } } });
  return count;
}
