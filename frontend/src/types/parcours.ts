export type Duree = '30min' | '1h' | '2h' | 'soiree' | 'inconnu';
export type Budget = 'gratuit' | '10' | '25' | 'illimite';

export type Reponses = {
  duree?: Duree;
  interets: string[];
  budget?: Budget;
};