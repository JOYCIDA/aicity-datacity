// Notation et classement des offres retenues : fonctions pures. Les poids sont dans
// config/scoring.ts.
import { BAREME } from '../config/scoring.js';
import type { Candidat, CandidatEvalue } from './filtre.service.js';

export type Critere = 'categorie' | 'proximite' | 'gratuit' | 'prixBas' | 'imminent' | 'marge';

export interface ContexteNotation {
  budgetMax: number | null;
  /** Envies du citoyen : préférences enregistrées, à défaut les catégories demandées. */
  categoriesPreferees: readonly string[];
}

export interface Note {
  score: number;
  criteres: { critere: Critere; points: number }[];
}

export function noter(c: CandidatEvalue, ctx: ContexteNotation): Note {
  const criteres: Note['criteres'] = [];
  const ajouter = (critere: Critere, points: number) => points > 0 && criteres.push({ critere, points });

  if (ctx.categoriesPreferees.includes(c.offre.categorie.code)) ajouter('categorie', BAREME.categorie);

  const palier = BAREME.proximite.find((p) => c.trajetMinutes <= p.maxMinutes);
  if (palier) ajouter('proximite', palier.points);

  if (c.offre.gratuit) ajouter('gratuit', BAREME.prix.gratuit);
  else if (
    ctx.budgetMax !== null &&
    c.offre.prix !== null &&
    c.offre.prix <= ctx.budgetMax * BAREME.prix.fractionBudget
  ) {
    ajouter('prixBas', BAREME.prix.sousFractionBudget);
  }

  if (c.attenteMinutes <= BAREME.imminence.dansMinutes) ajouter('imminent', BAREME.imminence.points);
  if (c.margeMinutes >= BAREME.marge.minMinutes) ajouter('marge', BAREME.marge.points);

  return { score: criteres.reduce((s, x) => s + x.points, 0), criteres };
}

/** RG13 : score décroissant, puis offre la plus récente, puis la plus proche. */
export function comparer(a: CandidatEvalue & Note, b: CandidatEvalue & Note) {
  return (
    b.score - a.score ||
    b.offre.creeLe.getTime() - a.offre.creeLe.getTime() ||
    a.distanceM - b.distanceM
  );
}

const euros = (prix: number, langue: 'FR' | 'EN') =>
  langue === 'FR' ? `${String(prix).replace('.', ',')} €` : `€${prix}`;

/** Phrase courte qui justifie la recommandation, dans la langue demandée. */
export function expliquer(c: CandidatEvalue & Note, langue: 'FR' | 'EN'): string {
  const fr = langue === 'FR';
  const a = (critere: Critere) => c.criteres.some((x) => x.critere === critere);
  const morceaux: string[] = [];

  if (a('categorie')) {
    const libelle = fr ? c.offre.categorie.libelleFr : c.offre.categorie.libelleEn;
    morceaux.push(fr ? `dans vos envies (${libelle.toLowerCase()})` : `matches your interests (${libelle.toLowerCase()})`);
  }
  morceaux.push(fr ? `à ${c.trajetMinutes} min à pied` : `${c.trajetMinutes} min walk`);
  if (a('gratuit')) morceaux.push(fr ? 'gratuit' : 'free');
  if (a('prixBas')) morceaux.push(fr ? `petit prix (${euros(c.offre.prix!, langue)})` : `low price (${euros(c.offre.prix!, langue)})`);
  if (a('imminent')) {
    morceaux.push(
      c.attenteMinutes === 0
        ? fr ? 'accessible dès votre arrivée' : 'open when you arrive'
        : fr ? `commence ${c.attenteMinutes} min après votre arrivée` : `starts ${c.attenteMinutes} min after you arrive`,
    );
  }
  if (a('marge')) morceaux.push(fr ? `il vous restera ${c.margeMinutes} min` : `${c.margeMinutes} min to spare`);

  const phrase = morceaux.join(' · ');
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

/** Note, trie et garde les `n` meilleures offres, avec leur explication FR et EN. */
export function classer<C extends Candidat>(retenus: CandidatEvalue<C>[], ctx: ContexteNotation, n: number) {
  return retenus
    .map((c) => ({ ...c, ...noter(c, ctx) }))
    .sort(comparer)
    .slice(0, n)
    .map((c, i) => ({
      ...c,
      rang: i + 1,
      explication: { FR: expliquer(c, 'FR'), EN: expliquer(c, 'EN') },
    }));
}
