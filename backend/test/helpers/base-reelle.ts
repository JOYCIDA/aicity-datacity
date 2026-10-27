// Base PostgreSQL réelle pour les tests d'intégration : TEST_DATABASE_URL (aicity_test par
// défaut), jamais la base de développement. Chaque fichier qui l'utilise la vide au départ.
import { execSync } from 'node:child_process';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client.js';

export const URL_BASE_TEST =
  process.env.TEST_DATABASE_URL ?? 'postgresql://aicity:aicity@localhost:5432/aicity_test';

export const prismaTest = new PrismaClient({ adapter: new PrismaPg({ connectionString: URL_BASE_TEST }) });

export const baseDisponible = await prismaTest.$queryRaw`SELECT 1`.then(
  () => true,
  () => false,
);

/** Applique les migrations puis vide les tables métier. */
export async function preparerBase() {
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: URL_BASE_TEST },
    stdio: 'ignore',
  });
  await prismaTest.$executeRawUnsafe(
    'TRUNCATE "ImportRapport", "JournalModeration", "Offre", "Entreprise", "Utilisateur", "Categorie" CASCADE',
  );
}
