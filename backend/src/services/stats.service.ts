// RG19 : compteurs anonymes par offre et par jour (StatOffreJour), et statistiques d'une
// entreprise (UC11). Aucune donnée individuelle : seulement des totaux par groupe d'offres.
import type { StatutOffre } from '../generated/prisma/client.js';
import { prisma } from '../prisma/client.js';
import { entrepriseDe } from './entreprise.service.js';

type Compteur = 'vues' | 'recommandations' | 'favoris';

const FUSEAU = 'Europe/Paris';
const JOUR_MS = 86_400_000;

/** Jour civil à Paris (minuit UTC de ce jour, comme la colonne @db.Date). */
export const jourParis = (d: Date) =>
  new Date(new Intl.DateTimeFormat('en-CA', { timeZone: FUSEAU }).format(d));

/** Incrémente un compteur du jour ; renvoie la requête, à placer dans une transaction. */
export function incrementer(offreId: string, compteur: Compteur, maintenant = new Date()) {
  const jour = jourParis(maintenant);
  return prisma.statOffreJour.upsert({
    where: { offreId_jour: { offreId, jour } },
    create: { offreId, jour, [compteur]: 1 },
    update: { [compteur]: { increment: 1 } },
  });
}

// Groupes affichés même vides, pour que les graphiques du tableau de bord gardent leur forme.
export const STATUTS: StatutOffre[] = ['EN_ATTENTE', 'VALIDE', 'REFUSE', 'EN_PAUSE', 'EXPIREE'];
export const CRENEAUX = ['MATIN', 'APRES_MIDI', 'SOIREE'] as const;
// Mêmes paliers que la question « budget » posée au citoyen.
export const TRANCHES_BUDGET = ['GRATUIT', 'JUSQU_A_10', 'JUSQU_A_20', 'JUSQU_A_50', 'PLUS_DE_50'] as const;

type Creneau = (typeof CRENEAUX)[number];
type TrancheBudget = (typeof TRANCHES_BUDGET)[number];

const heureParis = new Intl.DateTimeFormat('en-GB', { timeZone: FUSEAU, hour: 'numeric', hourCycle: 'h23' });

/** Créneau de début de l'offre, à l'heure de Paris : avant 12 h, avant 18 h, ensuite. */
export function creneau(debut: Date): Creneau {
  const heure = Number(heureParis.format(debut));
  if (heure < 12) return 'MATIN';
  if (heure < 18) return 'APRES_MIDI';
  return 'SOIREE';
}

export function trancheBudget(o: { gratuit: boolean; prix: number | null }): TrancheBudget {
  const prix = o.prix ?? 0;
  if (o.gratuit || prix === 0) return 'GRATUIT';
  if (prix <= 10) return 'JUSQU_A_10';
  if (prix <= 20) return 'JUSQU_A_20';
  if (prix <= 50) return 'JUSQU_A_50';
  return 'PLUS_DE_50';
}

export interface OffreAgregee {
  statut: StatutOffre;
  categorie: string;
  debut: Date;
  gratuit: boolean;
  prix: number | null;
  vues: number;
  recommandations: number;
  favoris: number;
}

type Totaux = { offres: number; vues: number; recommandations: number; favoris: number };

function totaliser(offres: OffreAgregee[]): Totaux {
  return offres.reduce(
    (t, o) => ({
      offres: t.offres + 1,
      vues: t.vues + o.vues,
      recommandations: t.recommandations + o.recommandations,
      favoris: t.favoris + o.favoris,
    }),
    { offres: 0, vues: 0, recommandations: 0, favoris: 0 },
  );
}

/** Regroupe les offres par clé ; chaque clé de `cles` figure dans le résultat, même à zéro. */
function grouper<K extends string>(offres: OffreAgregee[], cle: (o: OffreAgregee) => K, cles: readonly K[]) {
  const groupes = new Map<K, OffreAgregee[]>(cles.map((k) => [k, []]));
  for (const o of offres) groupes.set(cle(o), [...(groupes.get(cle(o)) ?? []), o]);
  return [...groupes].map(([k, membres]) => ({ cle: k, ...totaliser(membres) }));
}

/** Calcul pur des statistiques, à partir des offres et de leurs compteurs sur la période. */
export function agreger(offres: OffreAgregee[], categories: readonly string[]) {
  return {
    totaux: totaliser(offres),
    parStatut: grouper(offres, (o) => o.statut, STATUTS).map(({ cle, ...t }) => ({ statut: cle, ...t })),
    parCategorie: grouper(offres, (o) => o.categorie, categories).map(({ cle, ...t }) => ({ categorie: cle, ...t })),
    parCreneau: grouper(offres, (o) => creneau(o.debut), CRENEAUX).map(({ cle, ...t }) => ({ creneau: cle, ...t })),
    parBudget: grouper(offres, trancheBudget, TRANCHES_BUDGET).map(({ cle, ...t }) => ({ tranche: cle, ...t })),
  };
}

/**
 * UC11 : statistiques des seules offres de l'entreprise du compte connecté, sur les `jours`
 * derniers jours (aujourd'hui compris). Les nombres d'offres portent sur toutes ses offres.
 */
export async function statistiquesEntreprise(utilisateurId: string, jours: number, maintenant = new Date()) {
  const entreprise = await entrepriseDe(utilisateurId);
  const au = jourParis(maintenant);
  const du = new Date(au.getTime() - (jours - 1) * JOUR_MS);
  const surPeriode = { offre: { entrepriseId: entreprise.id }, jour: { gte: du, lte: au } };
  const somme = { vues: true, recommandations: true, favoris: true } as const;

  const [offres, categories, parOffre, parJour] = await prisma.$transaction([
    prisma.offre.findMany({
      where: { entrepriseId: entreprise.id },
      select: { id: true, statut: true, debut: true, gratuit: true, prix: true, categorie: { select: { code: true } } },
    }),
    prisma.categorie.findMany({ select: { code: true }, orderBy: { code: 'asc' } }),
    prisma.statOffreJour.groupBy({ by: ['offreId'], where: surPeriode, _sum: somme, orderBy: { offreId: 'asc' } }),
    prisma.statOffreJour.groupBy({ by: ['jour'], where: surPeriode, _sum: somme, orderBy: { jour: 'asc' } }),
  ]);

  const compteurs = new Map(parOffre.map((g) => [g.offreId, g._sum]));
  const agregees = offres.map((o): OffreAgregee => {
    const c = compteurs.get(o.id);
    return {
      statut: o.statut,
      categorie: o.categorie.code,
      debut: o.debut,
      gratuit: o.gratuit,
      prix: o.prix === null ? null : o.prix.toNumber(),
      vues: c?.vues ?? 0,
      recommandations: c?.recommandations ?? 0,
      favoris: c?.favoris ?? 0,
    };
  });

  return {
    periode: { du: du.toISOString().slice(0, 10), au: au.toISOString().slice(0, 10), jours },
    ...agreger(agregees, categories.map((c) => c.code)),
    parJour: parJour.map((g) => ({
      jour: g.jour.toISOString().slice(0, 10),
      vues: g._sum?.vues ?? 0,
      recommandations: g._sum?.recommandations ?? 0,
      favoris: g._sum?.favoris ?? 0,
    })),
  };
}
