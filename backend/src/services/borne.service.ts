// UC22 : administration des bornes. RG17 : la clé d'API n'est montrée qu'une fois, à la
// création (ou à son renouvellement) ; la base n'en garde que l'empreinte SHA-256.
import type { Prisma, StatutBorne } from '../generated/prisma/client.js';
import { prisma } from '../prisma/client.js';
import type { CreerBorneDto, ModifierBorneDto } from '../schemas/admin.schema.js';
import { notFound } from '../utils/errors.js';
import { empreinteSha256, genererCleBorne } from '../utils/hash.js';

const selectionBorne = {
  id: true,
  nom: true,
  emplacement: true,
  latitude: true,
  longitude: true,
  statut: true,
  dernierPing: true,
  _count: { select: { sessions: true } },
} as const satisfies Prisma.BorneSelect;

const borneDto = ({ _count, ...b }: Prisma.BorneGetPayload<{ select: typeof selectionBorne }>) => ({
  ...b,
  sessionsEnCours: _count.sessions,
});

export async function creer(dto: CreerBorneDto) {
  const cle = genererCleBorne();
  const borne = await prisma.borne.create({
    data: { ...dto, cleApiHash: empreinteSha256(cle) },
    select: selectionBorne,
  });
  return { borne: borneDto(borne), cle };
}

export async function lister() {
  const bornes = await prisma.borne.findMany({ select: selectionBorne, orderBy: { nom: 'asc' } });
  return bornes.map(borneDto);
}

/** Désactiver une borne ferme aussi ses sessions en cours (et leurs recherches, en cascade). */
export async function modifier(id: string, dto: ModifierBorneDto) {
  return prisma.$transaction(async (tx) => {
    const existe = await tx.borne.findUnique({ where: { id }, select: { id: true } });
    if (!existe) throw notFound('Borne introuvable');
    if (dto.statut === 'DESACTIVEE') await tx.sessionBorne.deleteMany({ where: { borneId: id } });
    return borneDto(await tx.borne.update({ where: { id }, data: dto, select: selectionBorne }));
  });
}

/** Nouvelle clé (clé perdue ou compromise) : l'ancienne cesse aussitôt de fonctionner. */
export async function renouvelerCle(id: string) {
  const cle = genererCleBorne();
  const { count } = await prisma.borne.updateMany({ where: { id }, data: { cleApiHash: empreinteSha256(cle) } });
  if (count === 0) throw notFound('Borne introuvable');
  const borne = await prisma.borne.findUniqueOrThrow({ where: { id }, select: selectionBorne });
  return { borne: borneDto(borne), cle };
}

/** Sans signal depuis ce délai, une borne ACTIVE passe HORS_LIGNE (elle signale chaque minute). */
export const SILENCE_MAX_MS = 5 * 60_000;

/** Passe HORS_LIGNE les bornes actives silencieuses ; renvoie leur nombre (job de purge). */
export async function marquerSilencieuses(maintenant = new Date()) {
  const { count } = await prisma.borne.updateMany({
    where: {
      statut: 'ACTIVE',
      OR: [{ dernierPing: null }, { dernierPing: { lt: new Date(maintenant.getTime() - SILENCE_MAX_MS) } }],
    },
    data: { statut: 'HORS_LIGNE' },
  });
  return count;
}

/** Supervision : bornes hors ligne d'abord, avec le silence écoulé depuis leur dernier signal. */
export async function supervision(maintenant = new Date()) {
  const bornes = (await lister()).map((b) => ({
    ...b,
    silenceSecondes: b.dernierPing ? Math.floor((maintenant.getTime() - b.dernierPing.getTime()) / 1000) : null,
  }));
  const ordre: Record<StatutBorne, number> = { HORS_LIGNE: 0, ACTIVE: 1, DESACTIVEE: 2 };
  bornes.sort((a, b) => ordre[a.statut] - ordre[b.statut]);
  const compter = (statut: StatutBorne) => bornes.filter((b) => b.statut === statut).length;
  return {
    seuilSilenceSecondes: SILENCE_MAX_MS / 1000,
    resume: {
      ACTIVE: compter('ACTIVE'),
      HORS_LIGNE: compter('HORS_LIGNE'),
      DESACTIVEE: compter('DESACTIVEE'),
      sessionsEnCours: bornes.reduce((n, b) => n + b.sessionsEnCours, 0),
    },
    bornes,
  };
}

/**
 * Borne correspondant à une clé, ou null. Chaque appel vaut signe de vie : `dernierPing` est
 * mis à jour, et une borne HORS_LIGNE qui se manifeste redevient ACTIVE.
 */
export async function authentifier(cle: string) {
  const borne = await prisma.borne.findUnique({ where: { cleApiHash: empreinteSha256(cle) } });
  if (!borne) return null;
  if (borne.statut === 'DESACTIVEE') return borne;
  const statut: StatutBorne = 'ACTIVE';
  await prisma.borne.update({ where: { id: borne.id }, data: { dernierPing: new Date(), statut } });
  return { ...borne, statut };
}
