import type { StatutCompte } from '../generated/prisma/client.js';
import { prisma } from '../prisma/client.js';
import type {
  DecisionEntrepriseDto,
  DecisionOffreDto,
  ListeEntreprisesDto,
  ListeOffresModerationDto,
} from '../schemas/admin.schema.js';
import { entrepriseDto, offreDto, page, selectionEntreprise, selectionOffre } from '../utils/dto.js';
import { conflict, notFound } from '../utils/errors.js';
import { cheminAbsolu } from './entreprise.service.js';

// Cycle de vie d'un compte entreprise : décision → (statut attendu, nouveau statut).
const TRANSITIONS_ENTREPRISE: Record<DecisionEntrepriseDto['decision'], [StatutCompte, StatutCompte]> = {
  VALIDE: ['EN_ATTENTE', 'ACTIF'],
  REFUSE: ['EN_ATTENTE', 'REFUSE'],
  SUSPENDU: ['ACTIF', 'SUSPENDU'],
  REACTIVE: ['SUSPENDU', 'ACTIF'],
};

export async function listerEntreprises(q: ListeEntreprisesDto) {
  const where = { statut: q.statut };
  const [entreprises, total] = await prisma.$transaction([
    prisma.entreprise.findMany({
      where,
      select: selectionEntreprise,
      orderBy: { creeLe: 'asc' }, // les plus anciennes demandes d'abord
      skip: (q.page - 1) * q.taille,
      take: q.taille,
    }),
    prisma.entreprise.count({ where }),
  ]);
  return page(entreprises.map(entrepriseDto), total, q);
}

export async function detailEntreprise(id: string) {
  const entreprise = await prisma.entreprise.findUnique({ where: { id }, select: selectionEntreprise });
  if (!entreprise) throw notFound('Entreprise introuvable');
  return entrepriseDto(entreprise);
}

export async function justificatif(id: string) {
  const entreprise = await prisma.entreprise.findUnique({
    where: { id },
    select: { justificatifUrl: true },
  });
  if (!entreprise) throw notFound('Entreprise introuvable');
  if (!entreprise.justificatifUrl) throw notFound('Aucun justificatif fourni');
  return cheminAbsolu(entreprise.justificatifUrl);
}

/** UC14 : la décision et sa ligne de journal sont écrites dans la même transaction. */
export async function deciderEntreprise(adminId: string, id: string, dto: DecisionEntrepriseDto) {
  const [depuis, vers] = TRANSITIONS_ENTREPRISE[dto.decision];
  return prisma.$transaction(async (tx) => {
    const actuelle = await tx.entreprise.findUnique({
      where: { id },
      select: { statut: true, justificatifUrl: true },
    });
    if (!actuelle) throw notFound('Entreprise introuvable');
    if (dto.decision === 'VALIDE' && !actuelle.justificatifUrl) {
      throw conflict('Impossible de valider un compte sans justificatif');
    }

    // Mise à jour conditionnelle : deux administrateurs ne peuvent pas décider deux fois.
    const { count } = await tx.entreprise.updateMany({
      where: { id, statut: depuis },
      data: { statut: vers, motifRefus: dto.motif ?? null },
    });
    if (count === 0) {
      throw conflict(`Décision ${dto.decision} impossible : le compte est ${actuelle.statut}`);
    }
    await tx.journalModeration.create({
      data: { adminId, entrepriseId: id, decision: dto.decision, motif: dto.motif ?? null },
    });
    return entrepriseDto(await tx.entreprise.findUniqueOrThrow({ where: { id }, select: selectionEntreprise }));
  });
}

export async function listerOffres(q: ListeOffresModerationDto) {
  const where = { statut: q.statut, source: 'ENTREPRISE' as const };
  const [offres, total] = await prisma.$transaction([
    prisma.offre.findMany({
      where,
      select: selectionOffre,
      orderBy: { majLe: 'asc' },
      skip: (q.page - 1) * q.taille,
      take: q.taille,
    }),
    prisma.offre.count({ where }),
  ]);
  return page(offres.map(offreDto), total, q);
}

/** UC17/UC18 : valide ou refuse une offre EN_ATTENTE (409 si elle a déjà été traitée). */
export async function deciderOffre(adminId: string, id: string, dto: DecisionOffreDto) {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.offre.updateMany({
      where: { id, statut: 'EN_ATTENTE' },
      data: { statut: dto.decision, motifRefus: dto.decision === 'REFUSE' ? dto.motif : null },
    });
    if (count === 0) {
      const existe = await tx.offre.findUnique({ where: { id }, select: { statut: true } });
      if (!existe) throw notFound('Offre introuvable');
      throw conflict(`Offre déjà traitée (statut ${existe.statut})`);
    }
    await tx.journalModeration.create({
      data: { adminId, offreId: id, decision: dto.decision, motif: dto.motif ?? null },
    });
    return offreDto(await tx.offre.findUniqueOrThrow({ where: { id }, select: selectionOffre }));
  });
}
