import { z } from 'zod';

export const modifierProfilSchema = z
  .object({
    nom: z.string().trim().min(2).max(120),
    typeActivite: z.string().trim().min(2).max(120),
    adresse: z.string().trim().min(5).max(250),
  })
  .partial()
  .refine((o) => Object.keys(o).length > 0, { message: 'Aucun champ à modifier' });

/** Période des compteurs : les `jours` derniers jours, aujourd'hui compris. */
export const statistiquesSchema = z.object({
  jours: z.coerce.number().int().min(1).max(365).default(30),
});

export type ModifierProfilDto = z.infer<typeof modifierProfilSchema>;
