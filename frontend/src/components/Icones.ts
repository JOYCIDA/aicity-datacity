import {
  Bike,
  Clock,
  Euro,
  Gift,
  Hourglass,
  Image,
  Leaf,
  ShoppingBag,
  Star,
  Ticket,
  Timer,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';

// Icônes de la maquette, associées aux valeurs du backend.
export const ICONES_CATEGORIE: Record<string, LucideIcon> = {
  culture: Image,
  gastronomie: Utensils,
  nature: Leaf,
  sport: Bike,
  loisirs: Ticket,
  shopping: ShoppingBag,
};

export function iconeDuree(minutes: number): LucideIcon {
  if (minutes <= 30) return Timer;
  if (minutes >= 180) return Hourglass;
  return Clock;
}

export function iconeBudget(euros: number | null): LucideIcon {
  if (euros === null) return Star;
  if (euros === 0) return Gift;
  return Euro;
}
