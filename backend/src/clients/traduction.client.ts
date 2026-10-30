// Traduction français → anglais du contenu des offres. Le fournisseur est choisi dans l'environnement
// (TRADUCTION_FOURNISSEUR) ; sans fournisseur, les offres restent en français (repli automatique).
import { env } from '../config/env.js';
import type { Fetch } from '../adapters/source.adapter.js';

export interface Traducteur {
  /** Traduit chaque texte, dans le même ordre. Lève une erreur si le fournisseur refuse. */
  traduire(textes: string[]): Promise<string[]>;
}

// DeepL accepte au plus 50 textes par requête.
const TEXTES_PAR_REQUETE = 40;

/** https://developers.deepl.com/docs/api-reference/translate : clé gratuite = suffixe « :fx ». */
export function creerTraducteurDeepL({
  cle,
  url,
  fetch = globalThis.fetch,
}: {
  cle: string;
  url?: string;
  fetch?: Fetch;
}): Traducteur {
  const base = url ?? (cle.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com');
  return {
    async traduire(textes) {
      const resultat: string[] = [];
      for (let i = 0; i < textes.length; i += TEXTES_PAR_REQUETE) {
        const lot = textes.slice(i, i + TEXTES_PAR_REQUETE);
        const res = await fetch(`${base}/v2/translate`, {
          method: 'POST',
          headers: { Authorization: `DeepL-Auth-Key ${cle}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: lot, source_lang: 'FR', target_lang: 'EN-GB' }),
          signal: AbortSignal.timeout(30_000),
        });
        if (!res.ok) {
          // 456 : quota du mois épuisé ; 403 : clé invalide.
          throw new Error(`DeepL a répondu HTTP ${res.status}`);
        }
        const corps = (await res.json()) as { translations?: { text: string }[] };
        if (corps.translations?.length !== lot.length) throw new Error('Réponse DeepL inattendue');
        resultat.push(...corps.translations.map((t) => t.text));
      }
      return resultat;
    },
  };
}

/** Le traducteur choisi par la configuration, ou null si aucun n'est configuré. */
export function traducteurConfigure(): Traducteur | null {
  if (env.TRADUCTION_FOURNISSEUR === 'deepl') {
    return creerTraducteurDeepL({ cle: env.DEEPL_API_KEY!, url: env.DEEPL_API_URL });
  }
  return null;
}
