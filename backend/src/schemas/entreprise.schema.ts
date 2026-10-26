import { z } from 'zod';

export const modifierProfilSchema = z
  .object({
    nom: z.string().trim().min(2).max(120),
    typeActivite: z.string().trim().min(2).max(120),
    adresse: z.string().trim().min(5).max(250),
  })
  .partial()
  .refine((o) => Object.keys(o).length > 0, { message: 'Aucun champ à modifier' });

export type ModifierProfilDto = z.infer<typeof modifierProfilSchema>;
