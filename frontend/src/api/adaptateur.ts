import { QuestionApi, ResultatApi } from './client';
import { Activite } from '../types/activite';
import { Choix, Questions } from '../types/questions';
import { formaterDate, formaterHoraires, LIBELLES_SOURCE } from '../utils/format';

export function versQuestions(api: QuestionApi[]): Questions {
  const question = (id: QuestionApi['id']) => {
    const q = api.find((x) => x.id === id);
    if (!q) throw new Error(`Question ${id} absente de la réponse du backend`);
    return q;
  };
  const choix = <T,>(q: QuestionApi) =>
    q.choix.map((c) => ({ valeur: c.valeur as T, libelle: c.libelle.FR })) as Choix<T>[];

  const budget = question('budgetMax');
  return {
    durees: choix<number>(question('tempsLibreMinutes')),
    budgets: choix<number | null>(budget),
    budgetLibre: budget.saisieLibre ? { ...budget.saisieLibre, libelle: budget.saisieLibre.libelle.FR } : null,
    categories: choix<string>(question('categories')),
  };
}

export function versActivite({ offre, distanceM, trajetMinutes, explication }: ResultatApi): Activite {
  return {
    id: offre.id,
    titre: offre.titre,
    categorie: offre.categorie.code,
    categorieLibelle: offre.categorie.libelleFr,
    description: offre.description,
    lieu: offre.lieu,
    adresse: offre.adresse,
    lat: offre.latitude,
    lng: offre.longitude,
    horaires: formaterHoraires(offre.horaires, offre.debut, offre.fin),
    prix: offre.gratuit ? 0 : offre.prix,
    distance_m: distanceM,
    trajet_min: trajetMinutes,
    source: LIBELLES_SOURCE[offre.source] ?? offre.source,
    source_url: offre.sourceUrl,
    date_maj: formaterDate(offre.majLe),
    explication,
  };
}
