// Signalement d'un problème sur une offre par un usager (mobile ou borne), sans identité.
import type { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../prisma/client.js';
import type { ListeSignalementsDto, SignalementDto } from '../schemas/signalement.schema.js';
import { page } from '../utils/dto.js';
import { notFound } from '../utils/errors.js';
import { whereVisible } from './offre.service.js';

/** 404 si l'offre n'est pas visible : on ne signale que ce que l'usager peut voir. */
export async function signaler(dto: SignalementDto, maintenant = new Date()) {
  const visible = await prisma.offre.findFirst({
    where: { id: dto.offreId, ...whereVisible(maintenant) },
    select: { id: true },
  });
  if (!visible) throw notFound('Offre introuvable');

  return prisma.signalement.create({
    data: { offreId: dto.offreId, motif: dto.motif, commentaire: dto.commentaire || null },
    select: { id: true, creeLe: true },
  });
}

const selection = {
  id: true,
  motif: true,
  commentaire: true,
  traite: true,
  creeLe: true,
  offre: { select: { id: true, titre: true, statut: true } },
} satisfies Prisma.SignalementSelect;

export async function lister(q: ListeSignalementsDto) {
  const where: Prisma.SignalementWhereInput = q.traite === undefined ? {} : { traite: q.traite };
  const [lignes, total] = await prisma.$transaction([
    prisma.signalement.findMany({
      where,
      select: selection,
      orderBy: { creeLe: 'desc' },
      skip: (q.page - 1) * q.taille,
      take: q.taille,
    }),
    prisma.signalement.count({ where }),
  ]);
  return page(lignes, total, q);
}

export async function marquer(id: string, traite: boolean) {
  const { count } = await prisma.signalement.updateMany({ where: { id }, data: { traite } });
  if (count === 0) throw notFound('Signalement introuvable');
  return prisma.signalement.findUniqueOrThrow({ where: { id }, select: selection });
}
