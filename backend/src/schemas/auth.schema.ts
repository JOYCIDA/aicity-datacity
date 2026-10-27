import { z } from 'zod';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email('Adresse e-mail invalide'));
const motDePasse = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .max(72, 'Le mot de passe est trop long (72 caractères maximum)');
const langue = z.enum(['FR', 'EN']).default('FR');

export const inscriptionSchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('CITOYEN'),
    email,
    motDePasse,
    langue,
  }),
  z.object({
    role: z.literal('ENTREPRISE'),
    email,
    motDePasse,
    langue,
    entreprise: z.object({
      nom: z.string().trim().min(2).max(120),
      typeActivite: z.string().trim().min(2).max(120),
      adresse: z.string().trim().min(5).max(250),
    }),
  }),
]);

export const connexionSchema = z.object({
  email,
  motDePasse: z.string().min(1, 'Mot de passe requis').max(200),
});

export type InscriptionDto = z.infer<typeof inscriptionSchema>;
export type ConnexionDto = z.infer<typeof connexionSchema>;
