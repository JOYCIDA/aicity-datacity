import { z } from 'zod';
import { CODES_CATEGORIES } from '../adapters/categories.js';
import { BUDGET_SAISI } from '../config/questions.js';
import { RAYON_DEFAUT_M } from '../config/scoring.js';
import { paginationSchema } from './offre.schema.js';

const latitude = z.number().min(-90).max(90);
const longitude = z.number().min(-180).max(180);
const langue = z.enum(['FR', 'EN']);

// Un des raccourcis de la question, ou un montant saisi librement (centimes inclus) ; null : sans limite.
const budgetMax = z.number().min(BUDGET_SAISI.min).max(BUDGET_SAISI.max).multipleOf(BUDGET_SAISI.pas).nullable();
const categories = z
  .array(z.enum(CODES_CATEGORIES))
  .max(CODES_CATEGORIES.length)
  .transform((c) => [...new Set(c)]);

/** Critères communs aux deux modes. Sans langue : celle de la session, sinon le français. */
const criteres = z.object({
  tempsLibreMinutes: z.number().int().min(15).max(12 * 60),
  budgetMax: budgetMax.default(null),
  categories: categories.default([]),
  rayonM: z.number().int().min(200).max(10_000).default(RAYON_DEFAUT_M),
  langue: langue.optional(),
});

/** Mode borne : RG2, la position est celle de la borne ; une position envoyée est ignorée. */
export const recommandationSessionSchema = criteres;

/** Mode mobile : la position vient de la requête et n'est jamais enregistrée. */
export const recommandationMobileSchema = criteres.extend({ latitude, longitude });

export const ouvrirSessionSchema = z.object({
  langue: langue.default('FR'),
});

export const interpretationSchema = z.object({
  texte: z.string().trim().min(1).max(500),
});

export const carteSchema = paginationSchema
  .extend({
    taille: z.coerce.number().int().min(1).max(500).default(100),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    rayonM: z.coerce.number().int().min(100).max(20_000).default(2000),
    categorie: z.enum(CODES_CATEGORIES).optional(),
  })
  .refine((q) => (q.latitude === undefined) === (q.longitude === undefined), {
    message: 'latitude et longitude vont ensemble',
    path: ['longitude'],
  });

/** UC10 : PUT remplace l'ensemble des préférences ; la langue (du compte) est facultative. */
export const preferencesSchema = z.object({
  categories,
  budgetMax,
  langue: langue.optional(),
});

export const favoriSchema = z.object({
  offreId: z.uuid(),
});

/** Suppression du compte : le mot de passe confirme une action irréversible. */
export const supprimerCompteSchema = z.object({
  motDePasse: z.string().min(1),
});

export type PreferencesDto = z.infer<typeof preferencesSchema>;

/** Demande prête pour le service : position et langue résolues selon le mode. */
export type RecommandationDto = z.infer<typeof criteres> & {
  latitude: number;
  longitude: number;
  langue: z.infer<typeof langue>;
};
export type CarteDto = z.infer<typeof carteSchema>;
