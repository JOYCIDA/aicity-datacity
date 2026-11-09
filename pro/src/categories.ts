import { Bike, Image, Leaf, ShoppingBag, Ticket, Utensils, type LucideIcon } from 'lucide-react';

// Mêmes icônes que l'appli citoyen (frontend/src/components/Icones.ts), par code de catégorie du backend.
export const ICONES_CATEGORIE: Record<string, LucideIcon> = {
  culture: Image,
  gastronomie: Utensils,
  nature: Leaf,
  sport: Bike,
  loisirs: Ticket,
  shopping: ShoppingBag,
};
