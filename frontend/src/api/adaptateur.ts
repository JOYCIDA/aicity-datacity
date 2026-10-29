import { ResultatApi } from './client';
import { Activite } from '../types/activite';
import { formaterDate, formaterHoraires, LIBELLES_SOURCE } from '../utils/format';

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
