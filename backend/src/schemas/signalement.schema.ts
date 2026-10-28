import { z } from 'zod';
import { paginationSchema } from './offre.schema.js';

export const MOTIFS_SIGNALEMENT = [
  'INFORMATION_ERRONEE',
  'OFFRE_EXPIREE',
  'LIEU_INCORRECT',
  'CONTENU_INAPPROPRIE',
  'AUTRE',
] as const;

export const signalementSchema = z.object({
  offreId: z.uuid(),
  motif: z.enum(MOTIFS_SIGNALEMENT),
  commentaire: z.string().trim().max(500).optional(),
});

export const listeSignalementsSchema = paginationSchema.extend({
  traite: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export const traiterSignalementSchema = z.object({ traite: z.boolean().default(true) });

export type SignalementDto = z.infer<typeof signalementSchema>;
export type ListeSignalementsDto = z.infer<typeof listeSignalementsSchema>;
