import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';
import { prisma } from '../prisma/client.js';
import type { ModifierProfilDto } from '../schemas/entreprise.schema.js';
import { entrepriseDto, selectionEntreprise } from '../utils/dto.js';
import { forbidden, notFound } from '../utils/errors.js';

/** Entreprise rattachée au compte connecté (404 si le compte n'en a pas). */
export async function entrepriseDe(utilisateurId: string) {
  const entreprise = await prisma.entreprise.findUnique({ where: { utilisateurId } });
  if (!entreprise) throw notFound('Aucune entreprise rattachée à ce compte');
  return entreprise;
}

/** RG8 : seule une entreprise validée par l'administration peut publier ou modifier des offres. */
export async function entrepriseActive(utilisateurId: string) {
  const entreprise = await entrepriseDe(utilisateurId);
  if (entreprise.statut !== 'ACTIF') {
    throw forbidden(`Action réservée aux comptes validés (statut actuel : ${entreprise.statut})`);
  }
  return entreprise;
}

export async function profil(utilisateurId: string) {
  const entreprise = await prisma.entreprise.findUnique({
    where: { utilisateurId },
    select: selectionEntreprise,
  });
  if (!entreprise) throw notFound('Aucune entreprise rattachée à ce compte');
  return entrepriseDto(entreprise);
}

export async function modifierProfil(utilisateurId: string, dto: ModifierProfilDto) {
  await entrepriseDe(utilisateurId);
  const entreprise = await prisma.entreprise.update({
    where: { utilisateurId },
    data: dto,
    select: selectionEntreprise,
  });
  return entrepriseDto(entreprise);
}

/** Chemin absolu d'un fichier stocké sous `UPLOAD_DIR` (les chemins en base sont relatifs). */
export const cheminAbsolu = (relatif: string) => path.resolve(env.UPLOAD_DIR, relatif);

/**
 * Enregistre le justificatif d'identité de l'entreprise (UC12). Après un refus, un nouveau
 * justificatif vaut nouvelle demande : le compte repasse EN_ATTENTE.
 */
export async function enregistrerJustificatif(utilisateurId: string, cheminRelatif: string) {
  const avant = await entrepriseDe(utilisateurId);
  const entreprise = await prisma.entreprise.update({
    where: { id: avant.id },
    data: {
      justificatifUrl: cheminRelatif,
      ...(avant.statut === 'REFUSE' ? { statut: 'EN_ATTENTE', motifRefus: null } : {}),
    },
    select: selectionEntreprise,
  });
  if (avant.justificatifUrl) await unlink(cheminAbsolu(avant.justificatifUrl)).catch(() => {});
  return entrepriseDto(entreprise);
}
