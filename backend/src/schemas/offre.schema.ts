import { z } from 'zod';

const texte = (min: number, max: number) => z.string().trim().min(min).max(max);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  taille: z.coerce.number().int().min(1).max(100).default(20),
});

const champsOffre = {
  categorieCode: z.string().trim().toLowerCase().min(1),
  titre: texte(3, 150),
  description: texte(1, 4000).nullish(),
  lieu: texte(2, 200),
  adresse: texte(5, 250).nullish(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  debut: z.coerce.date(),
  fin: z.coerce.date().nullish(),
  horaires: texte(1, 500).nullish(),
  dureeMinutes: z.number().int().min(5).max(24 * 60),
  prix: z.number().min(0).max(999_999.99).multipleOf(0.01).nullish(),
  gratuit: z.boolean().default(false),
  photoUrl: z.url().max(2048).nullish(),
  /** Crédit à afficher sous la photo (droit d'auteur) et sa description pour les lecteurs d'écran. */
  photoCredit: texte(1, 200).nullish(),
  photoAlt: texte(1, 300).nullish(),
  /** Version anglaise facultative ; absente, elle est traduite automatiquement si possible. */
  titreEn: texte(3, 150).nullish(),
  descriptionEn: texte(1, 4000).nullish(),
  lieuEn: texte(2, 200).nullish(),
};

const finApresDebut = (o: { debut?: Date; fin?: Date | null }) =>
  !o.debut || !o.fin || o.fin > o.debut;
const messageFin = { message: 'La fin doit être postérieure au début', path: ['fin'] };

export const creerOffreSchema = z
  .object(champsOffre)
  .refine(finApresDebut, messageFin)
  .refine((o) => o.gratuit || o.prix != null, {
    message: 'Indiquez un prix ou cochez « gratuit »',
    path: ['prix'],
  });

// En modification, `gratuit` ne prend pas de valeur par défaut : un champ absent reste inchangé.
export const modifierOffreSchema = z
  .object({ ...champsOffre, gratuit: z.boolean() })
  .partial()
  .refine((o) => Object.keys(o).length > 0, { message: 'Aucun champ à modifier' })
  .refine(finApresDebut, messageFin);

/** Pause et réactivation par l'entreprise elle-même. */
export const statutOffreSchema = z.object({
  statut: z.enum(['EN_PAUSE', 'VALIDE']),
});

export const listeOffresEntrepriseSchema = paginationSchema.extend({
  statut: z.enum(['EN_ATTENTE', 'VALIDE', 'REFUSE', 'EN_PAUSE', 'EXPIREE']).optional(),
});

export type CreerOffreDto = z.infer<typeof creerOffreSchema>;
export type ModifierOffreDto = z.infer<typeof modifierOffreSchema>;
export type StatutOffreDto = z.infer<typeof statutOffreSchema>;
export type PaginationDto = z.infer<typeof paginationSchema>;
export type ListeOffresEntrepriseDto = z.infer<typeof listeOffresEntrepriseSchema>;
