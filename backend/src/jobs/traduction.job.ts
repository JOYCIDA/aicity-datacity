import { traducteurConfigure } from '../clients/traduction.client.js';
import { traduireOffresManquantes } from '../services/traduction.service.js';

/** Après chaque import : ne fait rien sans traducteur configuré, ne lève jamais d'erreur. */
export async function executerTraduction() {
  const traducteur = traducteurConfigure();
  if (!traducteur) return null;
  try {
    const bilan = await traduireOffresManquantes(traducteur);
    console.log(
      `[traduction] ${bilan.offres} offres traduites (${bilan.caracteres} caractères)` +
        (bilan.interrompu ? ` — interrompue : ${bilan.interrompu}` : ''),
    );
    return bilan;
  } catch (err) {
    console.error('[traduction] échec :', err instanceof Error ? err.message : err);
    return null;
  }
}
