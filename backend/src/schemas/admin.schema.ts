import { z } from 'zod';
import { CODES_SOURCES } from '../adapters/source.adapter.js';
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

/** Journal des décisions, du plus récent au plus ancien, filtrable. */
export const journalSchema = paginationSchema
  .extend({
    decision: z.enum(['VALIDE', 'REFUSE', 'SUSPENDU', 'REACTIVE']).optional(),
    offreId: z.uuid().optional(),
    entrepriseId: z.uuid().optional(),
    du: z.coerce.date().optional(),
    au: z.coerce.date().optional(),
  })
  .refine((q) => !q.du || !q.au || q.du <= q.au, { message: '`du` doit précéder `au`', path: ['au'] });

export type JournalDto = z.infer<typeof journalSchema>;
export type ListeEntreprisesDto = z.infer<typeof listeEntreprisesSchema>;
export type DecisionEntrepriseDto = z.infer<typeof decisionEntrepriseSchema>;
export type ListeOffresModerationDto = z.infer<typeof listeOffresModerationSchema>;
export type DecisionOffreDto = z.infer<typeof decisionOffreSchema>;

export const sourceImportSchema = z.object({
  source: z.enum(CODES_SOURCES),
});

export const listeImportsSchema = paginationSchema.extend({
  source: z.enum(['OPENAGENDA', 'DATA_GOUV', 'PARIS_OPEN_DATA']).optional(),
});

export type ListeImportsDto = z.infer<typeof listeImportsSchema>;

const champsBorne = {
  nom: z.string().trim().min(2).max(120),
  emplacement: z.string().trim().min(2).max(250),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
};

export const creerBorneSchema = z.object(champsBorne);

export const modifierBorneSchema = z
  .object({ ...champsBorne, statut: z.enum(['ACTIVE', 'HORS_LIGNE', 'DESACTIVEE']) })
  .partial()
  .refine((o) => Object.keys(o).length > 0, { message: 'Aucun champ à modifier' });

export type CreerBorneDto = z.infer<typeof creerBorneSchema>;
export type ModifierBorneDto = z.infer<typeof modifierBorneSchema>;
