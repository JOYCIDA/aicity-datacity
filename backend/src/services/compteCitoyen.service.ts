// UC10 (préférences, favoris) et UC19 (RGPD : accès et effacement) pour le compte citoyen.
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma/client.js';
import type { PreferencesDto } from '../schemas/citoyen.schema.js';
import { offrePubliqueDto, selectionOffre } from '../utils/dto.js';
import { forbidden, invalid, notFound, unauthorized } from '../utils/errors.js';
import { whereVisible } from './offre.service.js';
import { incrementer } from './stats.service.js';

/**
 * Le jeton reste valide après la suppression du compte : chaque opération vérifie d'abord
 * que le compte existe encore (401 sinon).
 */
async function compte(utilisateurId: string) {
  const utilisateur = await prisma.utilisateur.findUnique({ where: { id: utilisateurId } });
  if (!utilisateur) throw unauthorized('Compte supprimé');
  return utilisateur;
}

const nombre = (d: { toNumber(): number } | null) => (d === null ? null : d.toNumber());

export async function preferences(utilisateurId: string) {
  const { langue } = await compte(utilisateurId);
  const preference = await prisma.preference.findUnique({
    where: { utilisateurId },
    select: { budgetMax: true, categories: { select: { code: true }, orderBy: { code: 'asc' } } },
  });
  return {
    categories: preference?.categories.map((c) => c.code) ?? [],
    budgetMax: nombre(preference?.budgetMax ?? null),
    langue,
  };
}

/** Remplace les préférences (catégories et budget) et, si elle est fournie, la langue du compte. */
export async function enregistrerPreferences(utilisateurId: string, dto: PreferencesDto) {
  await compte(utilisateurId);
  const categories = await prisma.categorie.findMany({
    where: { code: { in: dto.categories } },
    select: { id: true, code: true },
  });
  const inconnues = dto.categories.filter((code) => !categories.some((c) => c.code === code));
  if (inconnues.length) throw invalid('Catégorie inconnue', [{ path: ['categories'], message: inconnues.join(', ') }]);

  const liens = categories.map(({ id }) => ({ id }));
  await prisma.$transaction([
    prisma.preference.upsert({
      where: { utilisateurId },
      create: { utilisateurId, budgetMax: dto.budgetMax, categories: { connect: liens } },
      update: { budgetMax: dto.budgetMax, categories: { set: liens } },
    }),
    ...(dto.langue ? [prisma.utilisateur.update({ where: { id: utilisateurId }, data: { langue: dto.langue } })] : []),
  ]);
  return preferences(utilisateurId);
}

/** Favoris, du plus récent au plus ancien. `disponible` : l'offre est encore proposée au public. */
export async function favoris(utilisateurId: string) {
  await compte(utilisateurId);
  const lignes = await prisma.favori.findMany({
    where: { utilisateurId },
    select: { ajouteLe: true, offre: { select: selectionOffre } },
    orderBy: { ajouteLe: 'desc' },
  });
  const visibles = new Set(
    (
      await prisma.offre.findMany({
        where: { id: { in: lignes.map((l) => l.offre.id) }, ...whereVisible() },
        select: { id: true },
      })
    ).map((o) => o.id),
  );
  return lignes.map((l) => ({
    ajouteLe: l.ajouteLe,
    disponible: visibles.has(l.offre.id),
    offre: offrePubliqueDto(l.offre),
  }));
}

/**
 * Ajoute une offre visible aux favoris (404 sinon). Idempotent : `cree` vaut false si elle y
 * était déjà. Un nouvel ajout compte dans les statistiques anonymes du jour (RG19).
 */
export async function ajouterFavori(utilisateurId: string, offreId: string) {
  await compte(utilisateurId);
  const visible = await prisma.offre.findFirst({ where: { id: offreId, ...whereVisible() }, select: { id: true } });
  if (!visible) throw notFound('Offre introuvable');

  const cle = { utilisateurId_offreId: { utilisateurId, offreId } };
  let cree = false;
  if (!(await prisma.favori.findUnique({ where: cle }))) {
    try {
      await prisma.$transaction([
        prisma.favori.create({ data: { utilisateurId, offreId } }),
        incrementer(offreId, 'favoris'),
      ]);
      cree = true;
    } catch (err) {
      // Deux ajouts simultanés : le second trouve le favori déjà créé.
      if ((err as { code?: string }).code !== 'P2002') throw err;
    }
  }
  const favori = await prisma.favori.findUniqueOrThrow({
    where: cle,
    select: { ajouteLe: true, offre: { select: selectionOffre } },
  });
  return { cree, favori: { ajouteLe: favori.ajouteLe, disponible: true, offre: offrePubliqueDto(favori.offre) } };
}

/** Retire un favori ; sans effet s'il n'existait pas (idempotent). */
export async function retirerFavori(utilisateurId: string, offreId: string) {
  await compte(utilisateurId);
  await prisma.favori.deleteMany({ where: { utilisateurId, offreId } });
}

/**
 * UC19, droit d'accès : tout ce que la base garde sur le compte. Le hash du mot de passe n'est
 * pas exporté. Rien d'autre n'est conservé : ni position, ni texte saisi (RG3).
 */
export async function mesDonnees(utilisateurId: string) {
  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id: utilisateurId },
    select: {
      id: true,
      email: true,
      role: true,
      langue: true,
      creeLe: true,
      preference: { select: { budgetMax: true, categories: { select: { code: true }, orderBy: { code: 'asc' } } } },
      favoris: {
        select: { ajouteLe: true, offre: { select: { id: true, titre: true, lieu: true, debut: true, fin: true } } },
        orderBy: { ajouteLe: 'desc' },
      },
      recherches: {
        select: {
          id: true,
          creeLe: true,
          tempsLibreMinutes: true,
          budgetMax: true,
          categories: true,
          rayonM: true,
          elargie: true,
          recommandations: {
            select: { rang: true, score: true, explication: true, offre: { select: { id: true, titre: true } } },
            orderBy: { rang: 'asc' },
          },
        },
        orderBy: { creeLe: 'desc' },
      },
    },
  });
  if (!utilisateur) throw unauthorized('Compte supprimé');

  const { preference, favoris, recherches, ...compteExporte } = utilisateur;
  return {
    exporteLe: new Date(),
    compte: compteExporte,
    preferences: preference && {
      categories: preference.categories.map((c) => c.code),
      budgetMax: nombre(preference.budgetMax),
    },
    favoris,
    recherches: recherches.map((r) => ({ ...r, budgetMax: nombre(r.budgetMax) })),
    nonConserve: [
      'Votre position : utilisée pour le calcul, jamais enregistrée.',
      'Les phrases saisies pour l’interprétation : jamais enregistrées (RG3).',
    ],
  };
}

/**
 * UC19, droit à l'effacement : le compte et, en cascade, préférences, favoris, recherches et
 * recommandations. Restent les compteurs anonymes des offres (RG19), qui ne désignent personne.
 */
export async function supprimerCompte(utilisateurId: string, motDePasse: string) {
  const utilisateur = await compte(utilisateurId);
  // 403 et non 401 : le jeton est valide, c'est la confirmation qui échoue.
  if (!(await bcrypt.compare(motDePasse, utilisateur.motDePasseHash))) throw forbidden('Mot de passe incorrect');
  await prisma.utilisateur.delete({ where: { id: utilisateurId } });
}
