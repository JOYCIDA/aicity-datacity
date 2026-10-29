import { QuestionApi, ResultatApi } from './client';
import { Activite } from '../types/activite';
import { Choix, Questions } from '../types/questions';
import { Langue, TEXTES } from '../i18n';
import { formaterDate, formaterHoraires } from '../utils/format';

export function versQuestions(api: QuestionApi[], langue: Langue): Questions {
  const question = (id: QuestionApi['id']) => {
    const q = api.find((x) => x.id === id);
    if (!q) throw new Error(`Question ${id} absente de la réponse du backend`);
    return q;
  };
  const choix = <T,>(q: QuestionApi) =>
    q.choix.map((c) => ({ valeur: c.valeur as T, libelle: c.libelle[langue] })) as Choix<T>[];

  const budget = question('budgetMax');
  return {
    durees: choix<number>(question('tempsLibreMinutes')),
    budgets: choix<number | null>(budget),
    budgetLibre: budget.saisieLibre ? { ...budget.saisieLibre, libelle: budget.saisieLibre.libelle[langue] } : null,
    categories: choix<string>(question('categories')),
  };
}

export function versActivite(
  { offre, distanceM, trajetMinutes, explication }: ResultatApi,
  langue: Langue,
): Activite {
  const t = TEXTES[langue];
  return {
    id: offre.id,
    titre: offre.titre,
    categorie: offre.categorie.code,
    categorieLibelle: langue === 'FR' ? offre.categorie.libelleFr : offre.categorie.libelleEn,
    description: offre.description,
    photo_url: offre.photoUrl,
    photo_credit: offre.photoCredit ?? null,
    photo_alt: offre.photoAlt ?? null,
    lieu: offre.lieu,
    adresse: offre.adresse,
    lat: offre.latitude,
    lng: offre.longitude,
    horaires: formaterHoraires(offre.horaires, offre.debut, offre.fin, t),
    prix: offre.gratuit ? 0 : offre.prix,
    distance_m: distanceM,
    trajet_min: trajetMinutes,
    source: t.sources[offre.source] ?? offre.source,
    source_url: offre.sourceUrl,
    date_maj: formaterDate(offre.majLe, t),
    explication,
  };
}
