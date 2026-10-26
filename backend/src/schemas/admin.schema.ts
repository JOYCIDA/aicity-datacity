import { z } from 'zod';
import { paginationSchema } from './offre.schema.js';

const motif = z.string().trim().min(5, 'Le motif doit contenir au moins 5 caractères').max(1000);

// RG7 : toute décision défavorable doit être motivée (422 sinon).
const motifSiDefavorable = (o: { decision: string; motif?: string }) =>
  !['REFUSE', 'SUSPENDU'].includes(o.decision) || !!o.motif;
const messageMotif = { message: 'Un motif est obligatoire pour cette décision', path: ['motif'] };

export const listeEntreprisesSchema = paginationSchema.extend({
  statut: z.enum(['EN_ATTENTE', 'ACTIF', 'REFUSE', 'SUSPENDU']).default('EN_ATTENTE'),
});

export const decisionEntrepriseSchema = z
  .object({
    decision: z.enum(['VALIDE', 'REFUSE', 'SUSPENDU', 'REACTIVE']),
    motif: motif.optional(),
  })
  .refine(motifSiDefavorable, messageMotif);

export const listeOffresModerationSchema = paginationSchema.extend({
  statut: z.enum(['EN_ATTENTE', 'VALIDE', 'REFUSE', 'EN_PAUSE', 'EXPIREE']).default('EN_ATTENTE'),
});

export const decisionOffreSchema = z
  .object({
    decision: z.enum(['VALIDE', 'REFUSE']),
    motif: motif.optional(),
  })
  .refine(motifSiDefavorable, messageMotif);

export type ListeEntreprisesDto = z.infer<typeof listeEntreprisesSchema>;
export type DecisionEntrepriseDto = z.infer<typeof decisionEntrepriseSchema>;
export type ListeOffresModerationDto = z.infer<typeof listeOffresModerationSchema>;
export type DecisionOffreDto = z.infer<typeof decisionOffreSchema>;
