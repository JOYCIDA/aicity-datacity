// Données initiales : les six catégories (FR/EN) et, si demandé, un compte administrateur.
// Idempotent : peut être relancé sans créer de doublons.
import bcrypt from 'bcryptjs';
import { prisma } from '../src/prisma/client.js';

// dureeDefautMinutes : durée retenue quand la source ne donne qu'une période (exposition sur
// plusieurs semaines…). C'est le minimum utile d'une visite : RG11 exige trajet + durée ≤ temps
// libre, donc au-dessus de 20 min le choix « 30 min » du questionnaire ne donnerait plus rien
// (un trajet de 10 min à pied + 20 min de visite tient dans 30 min).
const categories = [
  { code: 'culture', libelleFr: 'Culture', libelleEn: 'Culture', picto: 'museum', dureeDefautMinutes: 20 },
  { code: 'gastronomie', libelleFr: 'Gastronomie', libelleEn: 'Food & drink', picto: 'restaurant', dureeDefautMinutes: 20 },
  { code: 'nature', libelleFr: 'Nature', libelleEn: 'Nature', picto: 'park', dureeDefautMinutes: 15 },
  { code: 'sport', libelleFr: 'Sport', libelleEn: 'Sport', picto: 'sport', dureeDefautMinutes: 20 },
  { code: 'loisirs', libelleFr: 'Loisirs', libelleEn: 'Leisure', picto: 'leisure', dureeDefautMinutes: 20 },
  { code: 'shopping', libelleFr: 'Shopping', libelleEn: 'Shopping', picto: 'shopping', dureeDefautMinutes: 15 },
];

async function main() {
  for (const { code, ...reste } of categories) {
    await prisma.categorie.upsert({ where: { code }, update: reste, create: { code, ...reste } });
  }
  console.log(`Seed : ${categories.length} catégories à jour.`);

  // Le rôle ADMIN ne peut pas s'inscrire par l'API : on le crée ici à partir de l'environnement.
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const motDePasse = process.env.ADMIN_MOT_DE_PASSE;
  if (email && motDePasse) {
    const motDePasseHash = await bcrypt.hash(motDePasse, 12);
    await prisma.utilisateur.upsert({
      where: { email },
      update: {}, // ne promeut jamais un compte existant
      create: { email, motDePasseHash, role: 'ADMIN' },
    });
    console.log(`Seed : administrateur ${email} prêt.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
