// Traduit en anglais les offres proposées au public qui n'ont pas encore de version anglaise.
// Les plus proches dans le temps passent en premier ; un plafond de caractères protège le quota
// du fournisseur (le reste sera traité à l'exécution suivante).
import type { Traducteur } from '../clients/traduction.client.js';
import { env } from '../config/env.js';
import { prisma } from '../prisma/client.js';
import { whereVisible } from './offre.service.js';

const TAILLE_LOT = 15;

export interface BilanTraduction {
  offres: number;
  caracteres: number;
  /** Raison pour laquelle il reste des offres à traduire, ou null si tout est fait. */
  interrompu: string | null;
}

export async function traduireOffresManquantes(
  traducteur: Traducteur,
  { limiteCaracteres = env.TRADUCTION_MAX_CARACTERES, maintenant = new Date() } = {},
): Promise<BilanTraduction> {
  const bilan: BilanTraduction = { offres: 0, caracteres: 0, interrompu: null };

  for (;;) {
    const lot = await prisma.offre.findMany({
      where: {
        ...whereVisible(maintenant),
        OR: [{ titreEn: null }, { lieuEn: null }, { AND: [{ description: { not: null } }, { descriptionEn: null }] }],
      },
      select: { id: true, titre: true, description: true, lieu: true, titreEn: true, descriptionEn: true, lieuEn: true },
      orderBy: { debut: 'asc' },
      take: TAILLE_LOT,
    });
    if (lot.length === 0) return bilan;

    // Un tableau de textes à plat, avec de quoi remettre chaque traduction à sa place.
    const textes: string[] = [];
    const cibles: { id: string; champ: 'titreEn' | 'descriptionEn' | 'lieuEn' }[] = [];
    for (const o of lot) {
      if (o.titreEn === null) (textes.push(o.titre), cibles.push({ id: o.id, champ: 'titreEn' }));
      if (o.description !== null && o.descriptionEn === null) {
        (textes.push(o.description), cibles.push({ id: o.id, champ: 'descriptionEn' }));
      }
      if (o.lieuEn === null) (textes.push(o.lieu), cibles.push({ id: o.id, champ: 'lieuEn' }));
    }
    const caracteres = textes.reduce((n, t) => n + t.length, 0);
    if (bilan.caracteres + caracteres > limiteCaracteres) {
      bilan.interrompu = `plafond de ${limiteCaracteres} caractères atteint`;
      return bilan;
    }

    let traduits: string[];
    try {
      traduits = await traducteur.traduire(textes);
    } catch (err) {
      bilan.interrompu = err instanceof Error ? err.message : String(err);
      return bilan;
    }

    const parOffre = new Map<string, Record<string, string>>();
    cibles.forEach(({ id, champ }, i) => parOffre.set(id, { ...parOffre.get(id), [champ]: traduits[i]! }));
    await prisma.$transaction(
      [...parOffre.entries()].map(([id, data]) => prisma.offre.update({ where: { id }, data })),
    );
    bilan.offres += lot.length;
    bilan.caracteres += caracteres;
  }
}
