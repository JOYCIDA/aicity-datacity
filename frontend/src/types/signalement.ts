export type TypeErreur = 'horaires' | 'prix' | 'lieu' | 'annule' | 'autre';

export type Signalement = {
  activiteId: string;
  type: TypeErreur;
  commentaire: string;
};