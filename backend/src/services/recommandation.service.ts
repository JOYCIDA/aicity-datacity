// UC2 : recommandation des cinq meilleures offres pour un temps libre donné.
import { NB_RESULTATS, RAYON_DEFAUT_M, SCORE_MAX, SEUIL_ELARGISSEMENT } from '../config/scoring.js';
import type { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../prisma/client.js';
import type { RecommandationDto } from '../schemas/citoyen.schema.js';
import { offreDto, offrePubliqueDto, selectionOffre } from '../utils/dto.js';
import { unauthorized } from '../utils/errors.js';
import { boiteEnglobante } from '../utils/geo.js';
import { type Demande, filtrer } from './filtre.service.js';
import { whereVisible } from './offre.service.js';
import { classer } from './scoring.service.js';
import { incrementer } from './stats.service.js';

type Auteur = { utilisateurId?: string; sessionId?: string; anonyme?: true };

/**
 * Envies servant à la notation : préférences enregistrées, à défaut les catégories demandées.
 * Un jeton encore valide dont le compte a été supprimé (RGPD) reçoit 401.
 */
async function categoriesPreferees(utilisateurId: string | undefined, demandees: readonly string[]) {
  if (!utilisateurId) return demandees;
  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id: utilisateurId },
    select: { preference: { select: { categories: { select: { code: true } } } } },
  });
  if (!utilisateur) throw unauthorized('Compte supprimé');
  const enregistrees = utilisateur.preference?.categories.map((c) => c.code) ?? [];
  return enregistrees.length ? enregistrees : demandees;
}

export async function recommander(dto: RecommandationDto, auteur: Auteur, maintenant = new Date()) {
  const rayonInitial = dto.rayonM ?? RAYON_DEFAUT_M;
  const rayonMax = rayonInitial * 2;
  const demande: Demande = {
    position: { latitude: dto.latitude, longitude: dto.longitude },
    tempsLibreMinutes: dto.tempsLibreMinutes,
    budgetMax: dto.budgetMax,
    categories: dto.categories,
    maintenant,
  };

  // Préfiltre SQL en une seule requête, sur la zone élargie : les filtres pures tranchent ensuite.
  const zone = boiteEnglobante(demande.position, rayonMax);
  const where: Prisma.OffreWhereInput = {
    ...whereVisible(maintenant),
    latitude: { gte: zone.latMin, lte: zone.latMax },
    longitude: { gte: zone.lonMin, lte: zone.lonMax },
    debut: { lte: new Date(maintenant.getTime() + dto.tempsLibreMinutes * 60_000) },
    ...(dto.categories.length && { categorie: { code: { in: dto.categories } } }),
    ...(dto.budgetMax !== null && {
      OR: [{ gratuit: true }, { prix: { lte: dto.budgetMax } }],
    }),
  };
  const lignes = await prisma.offre.findMany({ where, select: selectionOffre });
  const parId = new Map(lignes.map((l) => [l.id, l]));
  const candidats = lignes.map(offreDto);

  // RG12 : moins de trois offres dans le rayon demandé → on le double, une seule fois.
  let rayonM = rayonInitial;
  let retenus = filtrer(candidats, demande, rayonM);
  const elargie = retenus.length < SEUIL_ELARGISSEMENT;
  if (elargie) {
    rayonM = rayonMax;
    retenus = filtrer(candidats, demande, rayonM);
  }

  const classes = classer(
    retenus,
    {
      budgetMax: dto.budgetMax,
      categoriesPreferees: await categoriesPreferees(auteur.utilisateurId, dto.categories),
    },
    NB_RESULTATS,
  );

  // Mobile sans compte : rien n'est enregistré, hormis les compteurs anonymes du jour (RG19).
  if (auteur.anonyme) {
    if (classes.length) {
      await prisma.$transaction(classes.map((c) => incrementer(c.offre.id, 'recommandations', maintenant)));
    }
    return {
      rechercheId: null,
      elargie,
      rayonM,
      resultats: classes.map((c) => ({
        rang: c.rang,
        score: c.score,
        scoreMax: SCORE_MAX,
        explication: c.explication[dto.langue],
        distanceM: c.distanceM,
        trajetMinutes: c.trajetMinutes,
        offre: offrePubliqueDto(parId.get(c.offre.id)!),
      })),
    };
  }

  // La position n'est pas enregistrée : la recherche ne garde que les critères (RGPD).
  // RG19 : chaque offre recommandée compte aussi dans les statistiques anonymes du jour.
  const [recherche] = await prisma.$transaction([
    prisma.recherche.create({
      data: {
        utilisateurId: auteur.utilisateurId ?? null,
        sessionId: auteur.sessionId ?? null,
        tempsLibreMinutes: dto.tempsLibreMinutes,
        budgetMax: dto.budgetMax,
        categories: dto.categories,
        rayonM,
        elargie,
        recommandations: {
          create: classes.map((c) => ({
            offreId: c.offre.id,
            score: c.score,
            rang: c.rang,
            explication: c.explication[dto.langue],
          })),
        },
      },
      select: { id: true },
    }),
    ...classes.map((c) => incrementer(c.offre.id, 'recommandations', maintenant)),
  ]);

  return {
    rechercheId: recherche.id,
    elargie,
    rayonM,
    resultats: classes.map((c) => ({
      rang: c.rang,
      score: c.score,
      scoreMax: SCORE_MAX,
      explication: c.explication[dto.langue],
      distanceM: c.distanceM,
      trajetMinutes: c.trajetMinutes,
      offre: offrePubliqueDto(parId.get(c.offre.id)!),
    })),
  };
}
