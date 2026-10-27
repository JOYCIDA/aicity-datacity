import type { Prisma, StatutOffre } from '../generated/prisma/client.js';
import { prisma } from '../prisma/client.js';
import type { CarteDto } from '../schemas/citoyen.schema.js';
import type {
  CreerOffreDto,
  ListeOffresEntrepriseDto,
  ModifierOffreDto,
  PaginationDto,
  StatutOffreDto,
} from '../schemas/offre.schema.js';
import { offreDto, offrePubliqueDto, page, selectionOffre } from '../utils/dto.js';
import { conflict, forbidden, invalid, notFound } from '../utils/errors.js';
import { boiteEnglobante } from '../utils/geo.js';
import { entrepriseActive, entrepriseDe } from './entreprise.service.js';
import { incrementer } from './stats.service.js';

// RG6 : modifier l'un de ces champs sur une offre déjà validée impose une nouvelle modération.
const CHAMPS_SENSIBLES = ['lieu', 'adresse', 'latitude', 'longitude', 'prix', 'gratuit', 'debut', 'fin'] as const;

const selectionControle = {
  id: true,
  statut: true,
  lieu: true,
  adresse: true,
  latitude: true,
  longitude: true,
  prix: true,
  gratuit: true,
  debut: true,
  fin: true,
  entreprise: { select: { utilisateurId: true } },
} as const satisfies Prisma.OffreSelect;

type OffreControle = Prisma.OffreGetPayload<{ select: typeof selectionControle }>;

async function categorieId(code: string) {
  const categorie = await prisma.categorie.findUnique({ where: { code }, select: { id: true } });
  if (!categorie) throw invalid('Catégorie inconnue', [{ path: ['categorieCode'], message: code }]);
  return categorie.id;
}

/** RG16 : l'offre doit appartenir à l'entreprise du compte connecté (403 sinon). */
async function offreDuProprietaire(utilisateurId: string, offreId: string) {
  const offre = await prisma.offre.findUnique({ where: { id: offreId }, select: selectionControle });
  if (!offre) throw notFound('Offre introuvable');
  if (offre.entreprise?.utilisateurId !== utilisateurId) {
    throw forbidden('Cette offre appartient à une autre entreprise');
  }
  return offre;
}

const normaliser = (v: unknown) => {
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'object' && v !== null && 'toNumber' in v) return (v as Prisma.Decimal).toNumber();
  return v ?? null;
};

function champSensibleModifie(avant: OffreControle, dto: ModifierOffreDto) {
  return CHAMPS_SENSIBLES.some(
    (champ) => dto[champ] !== undefined && normaliser(dto[champ]) !== normaliser(avant[champ]),
  );
}

/** Statut de l'offre après une modification par l'entreprise. */
function statutApresModification(avant: OffreControle, dto: ModifierOffreDto): StatutOffre {
  switch (avant.statut) {
    case 'EXPIREE':
      throw conflict('Une offre expirée ne peut plus être modifiée');
    case 'REFUSE':
      return 'EN_ATTENTE'; // corriger une offre refusée la soumet à nouveau
    case 'VALIDE':
    case 'EN_PAUSE':
      return champSensibleModifie(avant, dto) ? 'EN_ATTENTE' : avant.statut;
    default:
      return avant.statut;
  }
}

export async function creer(utilisateurId: string, dto: CreerOffreDto) {
  const entreprise = await entrepriseActive(utilisateurId);
  const { categorieCode, ...champs } = dto;
  const offre = await prisma.offre.create({
    data: {
      ...champs,
      entrepriseId: entreprise.id,
      categorieId: await categorieId(categorieCode),
      source: 'ENTREPRISE',
      statut: 'EN_ATTENTE', // RG5 : toute nouvelle offre passe par la modération
    },
    select: selectionOffre,
  });
  return offreDto(offre);
}

export async function listerMiennes(utilisateurId: string, q: ListeOffresEntrepriseDto) {
  const entreprise = await entrepriseDe(utilisateurId);
  const where = { entrepriseId: entreprise.id, ...(q.statut ? { statut: q.statut } : {}) };
  const [offres, total] = await prisma.$transaction([
    prisma.offre.findMany({
      where,
      select: selectionOffre,
      orderBy: { creeLe: 'desc' },
      skip: (q.page - 1) * q.taille,
      take: q.taille,
    }),
    prisma.offre.count({ where }),
  ]);
  return page(offres.map(offreDto), total, q);
}

export async function detailMienne(utilisateurId: string, offreId: string) {
  await offreDuProprietaire(utilisateurId, offreId);
  const offre = await prisma.offre.findUniqueOrThrow({ where: { id: offreId }, select: selectionOffre });
  return offreDto(offre);
}

export async function modifier(utilisateurId: string, offreId: string, dto: ModifierOffreDto) {
  const avant = await offreDuProprietaire(utilisateurId, offreId);
  await entrepriseActive(utilisateurId);

  const debut = dto.debut ?? avant.debut;
  const fin = dto.fin === undefined ? avant.fin : dto.fin;
  if (fin && fin <= debut) {
    throw invalid('La fin doit être postérieure au début', [{ path: ['fin'] }]);
  }
  const gratuit = dto.gratuit ?? avant.gratuit;
  const prix = dto.prix === undefined ? avant.prix : dto.prix;
  if (!gratuit && prix == null) {
    throw invalid('Indiquez un prix ou cochez « gratuit »', [{ path: ['prix'] }]);
  }

  const statut = statutApresModification(avant, dto);
  const { categorieCode, ...champs } = dto;
  try {
    const offre = await prisma.offre.update({
      // Le filtre sur le statut lu évite d'écraser une décision de modération intervenue entre-temps.
      where: { id: offreId, statut: avant.statut },
      data: {
        ...champs,
        ...(categorieCode ? { categorieId: await categorieId(categorieCode) } : {}),
        statut,
        ...(statut === 'EN_ATTENTE' ? { motifRefus: null } : {}),
      },
      select: selectionOffre,
    });
    return offreDto(offre);
  } catch (err) {
    if ((err as { code?: string }).code === 'P2025') {
      throw conflict('L’offre a changé de statut pendant la modification, réessayez');
    }
    throw err;
  }
}

/** Pause (VALIDE → EN_PAUSE) et réactivation (EN_PAUSE → VALIDE) par l'entreprise. */
export async function changerStatut(utilisateurId: string, offreId: string, dto: StatutOffreDto) {
  await offreDuProprietaire(utilisateurId, offreId);
  await entrepriseActive(utilisateurId);

  const depuis: StatutOffre = dto.statut === 'EN_PAUSE' ? 'VALIDE' : 'EN_PAUSE';
  const { count } = await prisma.offre.updateMany({
    where: { id: offreId, statut: depuis },
    data: { statut: dto.statut },
  });
  if (count === 0) {
    throw conflict(
      dto.statut === 'EN_PAUSE'
        ? 'Seule une offre validée peut être mise en pause'
        : 'Seule une offre en pause peut être réactivée',
    );
  }
  const offre = await prisma.offre.findUniqueOrThrow({ where: { id: offreId }, select: selectionOffre });
  return offreDto(offre);
}

/** Offres visibles du public : validées, non terminées, d'une entreprise toujours active. */
export function whereVisible(maintenant = new Date()): Prisma.OffreWhereInput {
  return {
    statut: 'VALIDE',
    AND: [
      { OR: [{ fin: null }, { fin: { gte: maintenant } }] },
      { OR: [{ entrepriseId: null }, { entreprise: { statut: 'ACTIF' } }] },
    ],
  };
}

/** Carte : offres visibles, éventuellement dans une zone (rectangle autour du centre) et une catégorie. */
export async function listerPubliques(q: PaginationDto & Partial<CarteDto>) {
  const zone =
    q.latitude !== undefined && q.longitude !== undefined
      ? boiteEnglobante({ latitude: q.latitude, longitude: q.longitude }, q.rayonM ?? 2000)
      : null;
  const where: Prisma.OffreWhereInput = {
    ...whereVisible(),
    ...(zone && {
      latitude: { gte: zone.latMin, lte: zone.latMax },
      longitude: { gte: zone.lonMin, lte: zone.lonMax },
    }),
    ...(q.categorie && { categorie: { code: q.categorie } }),
  };
  const [offres, total] = await prisma.$transaction([
    prisma.offre.findMany({
      where,
      select: selectionOffre,
      orderBy: { debut: 'asc' },
      skip: (q.page - 1) * q.taille,
      take: q.taille,
    }),
    prisma.offre.count({ where }),
  ]);
  return page(offres.map(offrePubliqueDto), total, q);
}

/** Fiche publique (UC8) : 404 si l'offre n'est pas visible ; chaque lecture compte une vue. */
export async function detailPublique(offreId: string) {
  const maintenant = new Date();
  const visible = await prisma.offre.findFirst({
    where: { id: offreId, ...whereVisible(maintenant) },
    select: { id: true },
  });
  if (!visible) throw notFound('Offre introuvable');

  // RG19 : compteur anonyme par jour, en plus du total porté par l'offre.
  const [offre] = await prisma.$transaction([
    prisma.offre.update({ where: { id: offreId }, data: { vues: { increment: 1 } }, select: selectionOffre }),
    incrementer(offreId, 'vues', maintenant),
  ]);
  return offrePubliqueDto(offre);
}
