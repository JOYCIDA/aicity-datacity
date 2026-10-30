// Commande : npm run traduire — traduit maintenant les offres sans version anglaise.
import { prisma } from '../prisma/client.js';
import { traducteurConfigure } from '../clients/traduction.client.js';
import { executerTraduction } from './traduction.job.js';

if (!traducteurConfigure()) {
  console.log('Aucun traducteur configuré : renseignez TRADUCTION_FOURNISSEUR et DEEPL_API_KEY dans .env.');
} else {
  await executerTraduction();
}
await prisma.$disconnect();
