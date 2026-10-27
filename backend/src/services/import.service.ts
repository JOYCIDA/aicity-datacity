import type { OffreNormalisee, SourceAdapter } from '../adapters/source.adapter.js';
import type { ImportRapport, Prisma } from '../generated/prisma/client.js';
import { prisma } from '../prisma/client.js';
import { page } from '../utils/dto.js';
import { conflict } from '../utils/errors.js';

const TAILLE_LOT = 100;
// Au-delà, un rapport EN_COURS est considéré comme abandonné (processus tué en plein import).
const DUREE_MAX_IMPORT_MS = 2 * 60 * 60 * 1000;

type Motif = 'titre' | 'lieu' | 'coordonnees' | 'date' | 'illisible';

/** RG4/RG9 : les données publiques ne passent pas par la modération, mais doivent être complètes. */
function motifRejet(o: OffreNormalisee): Motif | null {
  if (!o.titre) return 'titre';
  if (!o.lieu) return 'lieu';
  if (o.latitude == null || o.longitude == null) return 'coordonnees';
  if (!o.debut) return 'date';
  return null;
}

/**
 * Ouvre le rapport (409 si la même source est déjà en cours d'import) puis lance l'import.
 * `termine` ne rejette jamais : un échec est consigné dans le rapport (statut ECHEC).
 */
export async function demarrerImport(adapter: SourceAdapter, options: { maintenant?: Date } = {}) {
  const enCours = await prisma.importRapport.findFirst({
    where: {
      source: adapter.source,
      statut: 'EN_COURS',
      debutLe: { gt: new Date(Date.now() - DUREE_MAX_IMPORT_MS) },
    },
  });
  if (enCours) throw conflict(`Un import ${adapter.code} est déjà en cours`);

  const rapport = await prisma.importRapport.create({
    data: { source: adapter.source, debutLe: new Date() },
  });
  return { rapport, termine: executer(adapter, rapport, options.maintenant) };
}

/** Variante synchrone, pour le planificateur et les tests. */
export async function importer(adapter: SourceAdapter, options: { maintenant?: Date } = {}) {
  return (await demarrerImport(adapter, options)).termine;
}

async function executer(adapter: SourceAdapter, rapport: ImportRapport, maintenant = new Date()) {
  try {
    const bruts = await adapter.recuperer();
    const categories = new Map(
      (await prisma.categorie.findMany()).map((c) => [c.code, c] as const),
    );
    if (categories.size === 0) throw new Error('Aucune catégorie en base : lancez `npm run seed`');

    const rejets: Record<Motif, number> = { titre: 0, lieu: 0, coordonnees: 0, date: 0, illisible: 0 };
    let ignorees = 0;
    // Une même source peut répéter un événement (plusieurs agendas) : la dernière version l'emporte.
    const offres = new Map<string, Prisma.OffreUncheckedCreateInput>();

    for (const brut of bruts) {
      let o: OffreNormalisee | null;
      try {
        o = adapter.normaliser(brut);
      } catch {
        rejets.illisible++;
        continue;
      }
      if (!o) {
        ignorees++; // hors périmètre : annulé, en ligne…
        continue;
      }
      const motif = motifRejet(o);
      if (motif) {
        rejets[motif]++;
        continue;
      }
      const categorie = categories.get(o.categorieCode) ?? categories.get('loisirs')!;
      const dureeMinutes = o.dureeMinutes ?? categorie.dureeDefautMinutes;
      const fin = o.fin ?? new Date(o.debut!.getTime() + dureeMinutes * 60_000);
      if (fin < maintenant) {
        ignorees++; // déjà terminé : rien à proposer
        continue;
      }
      offres.set(o.idExterne, {
        source: adapter.source,
        idExterne: o.idExterne,
        entrepriseId: null,
        categorieId: categorie.id,
        titre: o.titre!,
        description: o.description,
        lieu: o.lieu!,
        adresse: o.adresse,
        latitude: o.latitude!,
        longitude: o.longitude!,
        debut: o.debut!,
        fin,
        dureeMinutes,
        prix: o.prix,
        gratuit: o.gratuit,
        photoUrl: o.photoUrl,
        sourceUrl: o.sourceUrl,
        statut: 'VALIDE', // RG5 : seules les offres d'entreprise passent par la modération
        motifRefus: null,
      });
    }

    const { nbCrees, nbMisAJour } = await enregistrer(adapter, [...offres.values()]);
    const nbExpirees = await expirerOffres(maintenant);
    const nbRejetes = Object.values(rejets).reduce((a, b) => a + b, 0);
    const detailRejets = Object.entries(rejets)
      .filter(([, n]) => n > 0)
      .map(([motif, n]) => `${motif} : ${n}`)
      .join(', ');

    return await prisma.importRapport.update({
      where: { id: rapport.id },
      data: {
        statut: 'TERMINE',
        finLe: new Date(),
        nbCrees,
        nbMisAJour,
        nbRejetes,
        message:
          `${bruts.length} reçus, ${ignorees} ignorés (terminés ou hors périmètre), ` +
          `${nbExpirees} offres expirées` +
          (detailRejets ? ` ; rejets — ${detailRejets}` : ''),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return prisma.importRapport.update({
      where: { id: rapport.id },
      data: { statut: 'ECHEC', finLe: new Date(), message: message.slice(0, 1000) },
    });
  }
}

/** Upsert sur (source, idExterne) : relancer un import ne crée jamais de doublon. */
async function enregistrer(adapter: SourceAdapter, offres: Prisma.OffreUncheckedCreateInput[]) {
  let nbCrees = 0;
  let nbMisAJour = 0;
  for (let i = 0; i < offres.length; i += TAILLE_LOT) {
    const lot = offres.slice(i, i + TAILLE_LOT);
    const existants = new Set(
      (
        await prisma.offre.findMany({
          where: { source: adapter.source, idExterne: { in: lot.map((o) => o.idExterne!) } },
          select: { idExterne: true },
        })
      ).map((o) => o.idExterne),
    );
    await prisma.$transaction(
      lot.map(({ source, idExterne, ...champs }) =>
        prisma.offre.upsert({
          where: { source_idExterne: { source: source!, idExterne: idExterne! } },
          create: { source, idExterne, ...champs },
          update: champs,
        }),
      ),
    );
    for (const o of lot) {
      if (existants.has(o.idExterne!)) nbMisAJour++;
      else nbCrees++;
    }
  }
  return { nbCrees, nbMisAJour };
}

/** Passe en EXPIREE toute offre encore proposée dont la fin est dépassée (toutes sources). */
export async function expirerOffres(maintenant = new Date()) {
  const { count } = await prisma.offre.updateMany({
    where: { statut: { in: ['VALIDE', 'EN_PAUSE', 'EN_ATTENTE'] }, fin: { lt: maintenant } },
    data: { statut: 'EXPIREE' },
  });
  return count;
}

export async function listerRapports(q: { source?: ImportRapport['source']; page: number; taille: number }) {
  const where = q.source ? { source: q.source } : {};
  const [rapports, total] = await prisma.$transaction([
    prisma.importRapport.findMany({
      where,
      orderBy: { debutLe: 'desc' },
      skip: (q.page - 1) * q.taille,
      take: q.taille,
    }),
    prisma.importRapport.count({ where }),
  ]);
  return page(rapports, total, q);
}
