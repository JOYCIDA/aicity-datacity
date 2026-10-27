import { createApp } from './app.js';
import { env } from './config/env.js';
import { demarrerPurge } from './jobs/purge.job.js';
import { demarrerPlanification } from './jobs/scheduler.js';
import { prisma } from './prisma/client.js';

const app = createApp();
const server = app.listen(env.PORT, () => {
  console.log(`AiCity API prête sur http://localhost:${env.PORT}/api`);
});
const planification = env.IMPORT_PLANIFIE ? demarrerPlanification() : null;
const purge = demarrerPurge();

async function arreter(signal: string) {
  console.log(`${signal} reçu, arrêt en cours...`);
  await planification?.stop();
  await purge.stop();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on('SIGINT', () => void arreter('SIGINT'));
process.on('SIGTERM', () => void arreter('SIGTERM'));
