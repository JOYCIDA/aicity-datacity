export type Duree = number; // minutes (tempsLibreMinutes)
// Budget en euros ; 0 = gratuit ; null = sans limite ; undefined = pas encore choisi.
export type Budget = number | null;

export type Reponses = {
  duree?: Duree;
  interets: string[]; // codes de catégories du backend
  budget?: Budget;
};