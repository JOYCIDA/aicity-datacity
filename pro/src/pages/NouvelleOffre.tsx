import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin } from 'lucide-react';
import { api, ErreurApi, type NouvelleOffre as DonneesOffre } from '../api';
import { useAuth } from '../auth';
import { Alerte } from '../composants/Alerte';
import { Champ } from '../composants/Champ';
import { ChoixLieu, type Position } from '../composants/ChoixLieu';
import { ZoneTexte } from '../composants/ZoneTexte';
import { ICONES_CATEGORIE } from '../categories';
import { formaterPrix } from '../format';

// Codes et libellés des six catégories du backend (backend/prisma/seed.ts).
const CATEGORIES = [
  { code: 'culture', libelle: 'Culture' },
  { code: 'gastronomie', libelle: 'Gastronomie' },
  { code: 'nature', libelle: 'Nature' },
  { code: 'sport', libelle: 'Sport' },
  { code: 'loisirs', libelle: 'Loisirs' },
  { code: 'shopping', libelle: 'Shopping' },
];
const DUREES = [30, 60, 90, 120];

type Valeurs = {
  categorie: string;
  titre: string;
  description: string;
  lieu: string;
  adresse: string;
  debut: string; // « 2026-11-20T18:30 » (heure locale, champ datetime-local)
  fin: string;
  horaires: string;
  duree: string;
  gratuit: boolean;
  prix: string;
  photoUrl: string;
  photoCredit: string;
  photoAlt: string;
  titreEn: string;
  descriptionEn: string;
  lieuEn: string;
};
type Cle = keyof Valeurs | 'position';
type Erreurs = Partial<Record<Cle, string>>;

const ORDRE: Cle[] = ['categorie', 'titre', 'description', 'lieu', 'adresse', 'position', 'debut', 'fin', 'horaires', 'duree', 'prix', 'photoUrl', 'photoCredit', 'photoAlt', 'titreEn', 'descriptionEn', 'lieuEn'];

const longueur = (texte: string, min: number, max: number, facultatif = false) => {
  const n = texte.trim().length;
  if (facultatif && n === 0) return undefined;
  if (n < min) return min === 1 ? 'Ce champ est obligatoire.' : `Au moins ${min} caractères.`;
  if (n > max) return `${max} caractères au maximum.`;
  return undefined;
};

const lirePrix = (texte: string) => Number(texte.trim().replace(',', '.'));

// Mêmes règles que le backend (backend/src/schemas/offre.schema.ts).
function verifier(v: Valeurs, position: Position | null): Erreurs {
  const e: Erreurs = {};
  if (!v.categorie) e.categorie = 'Choisissez une catégorie.';
  e.titre = longueur(v.titre, 3, 150);
  e.description = longueur(v.description, 1, 4000, true);
  e.lieu = longueur(v.lieu, 2, 200);
  e.adresse = longueur(v.adresse, 5, 250, true);
  if (!position) e.position = 'Localisez l’adresse pour placer votre offre sur la carte.';
  if (!v.debut || Number.isNaN(new Date(v.debut).getTime())) e.debut = 'Indiquez la date et l’heure de début.';
  if (v.fin && v.debut && new Date(v.fin) <= new Date(v.debut)) e.fin = 'La fin doit être après le début.';
  e.horaires = longueur(v.horaires, 1, 500, true);
  const duree = Number(v.duree);
  if (!Number.isInteger(duree) || duree < 5 || duree > 1440) e.duree = 'Une durée entre 5 et 1 440 minutes (24 h).';
  if (!v.gratuit) {
    const prix = lirePrix(v.prix);
    if (v.prix.trim() === '') e.prix = 'Indiquez un prix, ou cochez « Gratuit ».';
    else if (!/^\d+([.,]\d{1,2})?$/.test(v.prix.trim()) || prix > 999999.99) e.prix = 'Prix invalide (ex. : 8,50).';
  }
  if (v.photoUrl.trim()) {
    if (!/^https?:\/\/\S+$/.test(v.photoUrl.trim()) || v.photoUrl.trim().length > 2048) e.photoUrl = 'Adresse d’image invalide (elle commence par https://).';
    // Droit d'auteur et accessibilité : une photo publiée a toujours un crédit et une description.
    e.photoCredit = longueur(v.photoCredit, 1, 200);
    e.photoAlt = longueur(v.photoAlt, 1, 300);
  }
  e.titreEn = longueur(v.titreEn, 3, 150, true);
  e.descriptionEn = longueur(v.descriptionEn, 1, 4000, true);
  e.lieuEn = longueur(v.lieuEn, 2, 200, true);
  for (const cle of Object.keys(e) as Cle[]) if (!e[cle]) delete e[cle];
  return e;
}

// Noms de champs du backend → champs du formulaire.
const CHAMPS_SERVEUR: Record<string, Cle> = {
  categorieCode: 'categorie',
  latitude: 'position',
  longitude: 'position',
  dureeMinutes: 'duree',
  gratuit: 'prix',
};

const nul = (texte: string) => (texte.trim() === '' ? null : texte.trim());

function Section({ numero, titre, aide, children }: { numero: number; titre: string; aide: string; children: ReactNode }) {
  return (
    <section className="carte section-formulaire" aria-labelledby={`section-${numero}`}>
      <header className="section-entete">
        <span className="section-numero" aria-hidden="true">
          {numero}
        </span>
        <div>
          <h2 id={`section-${numero}`} className="t-sous-titre">
            {titre}
          </h2>
          <p className="t-legende secondaire">{aide}</p>
        </div>
      </header>
      <div className="section-corps">{children}</div>
    </section>
  );
}

export default function NouvelleOffre() {
  const { utilisateur } = useAuth();
  const navigate = useNavigate();
  const formulaire = useRef<HTMLFormElement>(null);
  const [v, setV] = useState<Valeurs>({
    categorie: '',
    titre: '',
    description: '',
    lieu: utilisateur?.entreprise?.nom ?? '',
    adresse: '',
    debut: '',
    fin: '',
    horaires: '',
    duree: '60',
    gratuit: false,
    prix: '',
    photoUrl: '',
    photoCredit: '',
    photoAlt: '',
    titreEn: '',
    descriptionEn: '',
    lieuEn: '',
  });
  const [position, setPosition] = useState<Position | null>(null);
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [probleme, setProbleme] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  if (utilisateur?.entreprise?.statut !== 'ACTIF') {
    return (
      <div className="page">
        <h1 className="t-affiche">Nouvelle offre</h1>
        <Alerte type="info" titre="Votre compte n’est pas encore actif">
          <p>Vous pourrez publier des offres dès que l’administration AiCity aura validé votre établissement.</p>
          <p style={{ marginTop: 'var(--e-s)' }}>
            <Link to="/compte">Voir l’état de mon dossier</Link>
          </p>
        </Alerte>
      </div>
    );
  }

  const changer = <K extends keyof Valeurs>(cle: K, valeur: Valeurs[K]) => {
    setV((ancien) => ({ ...ancien, [cle]: valeur }));
    if (erreurs[cle]) setErreurs((ancien) => ({ ...ancien, [cle]: undefined }));
  };

  const allerAuPremier = (e: Erreurs) => {
    const premier = ORDRE.find((c) => e[c]);
    if (!premier) return;
    requestAnimationFrame(() => {
      const cible = formulaire.current?.querySelector<HTMLElement>(`[name="${premier}"], [data-champ="${premier}"]`);
      cible?.focus();
      cible?.scrollIntoView({ block: 'center' });
    });
  };

  const envoyer = async (ev: FormEvent) => {
    ev.preventDefault();
    setProbleme(null);
    const e = verifier(v, position);
    setErreurs(e);
    if (Object.keys(e).length > 0 || !position) {
      allerAuPremier(e);
      return;
    }
    const donnees: DonneesOffre = {
      categorieCode: v.categorie,
      titre: v.titre.trim(),
      description: nul(v.description),
      lieu: v.lieu.trim(),
      adresse: nul(v.adresse),
      latitude: position.latitude,
      longitude: position.longitude,
      debut: new Date(v.debut).toISOString(),
      fin: v.fin ? new Date(v.fin).toISOString() : null,
      horaires: nul(v.horaires),
      dureeMinutes: Number(v.duree),
      prix: v.gratuit ? null : Math.round(lirePrix(v.prix) * 100) / 100,
      gratuit: v.gratuit,
      photoUrl: nul(v.photoUrl),
      photoCredit: v.photoUrl.trim() ? nul(v.photoCredit) : null,
      photoAlt: v.photoUrl.trim() ? nul(v.photoAlt) : null,
      titreEn: nul(v.titreEn),
      descriptionEn: nul(v.descriptionEn),
      lieuEn: nul(v.lieuEn),
    };
    setEnCours(true);
    try {
      const offre = await api.creerOffre(donnees);
      navigate('/offres?statut=EN_ATTENTE', {
        state: { annonce: `« ${offre.titre} » a été envoyée à AiCity. Elle sera visible après vérification.` },
      });
    } catch (err) {
      if (err instanceof ErreurApi && Object.keys(err.champs).length > 0) {
        const e2: Erreurs = {};
        for (const [cle, message] of Object.entries(err.champs)) {
          const champ = CHAMPS_SERVEUR[cle] ?? (cle as Cle);
          if (ORDRE.includes(champ)) e2[champ] = message;
        }
        setErreurs(e2);
        allerAuPremier(e2);
        if (Object.keys(e2).length === 0) setProbleme(err.message);
      } else {
        setProbleme(err instanceof ErreurApi ? err.message : 'L’envoi a échoué. Réessayez dans un instant.');
      }
    } finally {
      setEnCours(false);
    }
  };

  const nbErreurs = Object.keys(erreurs).length;
  const IconeApercu = ICONES_CATEGORIE[v.categorie];
  const libelleCategorie = CATEGORIES.find((c) => c.code === v.categorie)?.libelle;
  const prixApercu = v.gratuit ? 'Gratuit' : v.prix.trim() && !Number.isNaN(lirePrix(v.prix)) ? formaterPrix(lirePrix(v.prix), false) : null;

  return (
    <div className="page page-formulaire">
      <Link to="/offres" className="lien-discret lien-retour">
        <ArrowLeft size={16} aria-hidden="true" />
        Mes offres
      </Link>
      <header>
        <h1 className="t-affiche">Nouvelle offre</h1>
        <p className="t-corps secondaire" style={{ marginTop: 'var(--e-s)' }}>
          Votre offre sera vérifiée par AiCity avant d’être proposée aux habitants.
        </p>
      </header>

      <div className="formulaire-et-apercu">
        <form ref={formulaire} className="formulaire-offre" onSubmit={envoyer} noValidate>
          {nbErreurs > 0 && (
            <Alerte type="erreur">
              {nbErreurs === 1 ? 'Un champ est à corriger.' : `${nbErreurs} champs sont à corriger.`} Le curseur est placé sur le premier.
            </Alerte>
          )}
          <p className="t-legende secondaire">
            Les champs marqués d’un <span className="obligatoire">*</span> sont obligatoires.
          </p>

          <Section numero={1} titre="Informations" aide="Catégorie, titre et description">
            <fieldset className="champ" aria-describedby={erreurs.categorie ? 'erreur-categorie' : undefined}>
              <legend className="champ-libelle">
                Catégorie
                <span className="obligatoire" aria-hidden="true">
                  *
                </span>
              </legend>
              <div className="tuiles-categorie">
                {CATEGORIES.map(({ code, libelle }) => {
                  const Icone = ICONES_CATEGORIE[code];
                  return (
                    <label key={code} className="tuile-categorie">
                      <input
                        type="radio"
                        name="categorie"
                        value={code}
                        checked={v.categorie === code}
                        onChange={() => changer('categorie', code)}
                      />
                      {Icone && <Icone size={22} aria-hidden="true" />}
                      <span>{libelle}</span>
                    </label>
                  );
                })}
              </div>
              {erreurs.categorie && (
                <p id="erreur-categorie" className="champ-erreur">
                  {erreurs.categorie}
                </p>
              )}
            </fieldset>
            <Champ
              libelle="Titre"
              name="titre"
              required
              maxLength={150}
              placeholder="Ex. : Visite guidée du musée"
              value={v.titre}
              onChange={(e) => changer('titre', e.target.value)}
              aide="3 à 150 caractères. Court et concret : c’est ce que le citoyen lit en premier."
              erreur={erreurs.titre}
            />
            <ZoneTexte
              libelle="Description"
              name="description"
              rows={5}
              maxLength={4000}
              value={v.description}
              onChange={(e) => changer('description', e.target.value)}
              aide="Facultatif. Ce qu’on y fait, pour qui, ce qu’il faut prévoir."
              erreur={erreurs.description}
            />
          </Section>

          <Section numero={2} titre="Lieu" aide="Où l’offre a lieu, et sa position exacte">
            <Champ
              libelle="Nom du lieu"
              name="lieu"
              required
              maxLength={200}
              value={v.lieu}
              onChange={(e) => changer('lieu', e.target.value)}
              erreur={erreurs.lieu}
            />
            <Champ
              libelle="Adresse"
              name="adresse"
              maxLength={250}
              placeholder="Ex. : 12 rue de Rivoli, 75004 Paris"
              value={v.adresse}
              onChange={(e) => changer('adresse', e.target.value)}
              aide="Affichée au citoyen, et utilisée pour localiser l’offre."
              erreur={erreurs.adresse}
            />
            <div className="champ-ancre" tabIndex={-1} data-champ="position">
              <ChoixLieu
                adresse={v.adresse}
                position={position}
                erreur={erreurs.position}
                onPosition={(p, trouvee) => {
                  setPosition(p);
                  setErreurs((ancien) => ({ ...ancien, position: undefined }));
                  if (trouvee && !v.adresse.trim()) changer('adresse', trouvee);
                }}
              />
            </div>
          </Section>

          <Section numero={3} titre="Quand et combien" aide="Dates, durée de visite et tarif">
            <div className="grille-champs">
              <Champ
                libelle="Début"
                name="debut"
                type="datetime-local"
                required
                value={v.debut}
                onChange={(e) => changer('debut', e.target.value)}
                aide="Heure de Paris."
                erreur={erreurs.debut}
              />
              <Champ
                libelle="Fin"
                name="fin"
                type="datetime-local"
                value={v.fin}
                onChange={(e) => changer('fin', e.target.value)}
                aide="Facultatif."
                erreur={erreurs.fin}
              />
            </div>
            <Champ
              libelle="Horaires"
              name="horaires"
              maxLength={500}
              placeholder="Ex. : du mardi au dimanche, 10 h – 18 h"
              value={v.horaires}
              onChange={(e) => changer('horaires', e.target.value)}
              aide="Facultatif. Remplace les dates dans l’affichage si vous le renseignez."
              erreur={erreurs.horaires}
            />
            <Champ
              libelle="Durée de la visite (en minutes)"
              name="duree"
              type="number"
              inputMode="numeric"
              min={5}
              max={1440}
              required
              value={v.duree}
              onChange={(e) => changer('duree', e.target.value)}
              aide="Temps moyen passé sur place : AiCity vérifie que l’offre tient dans le temps libre du citoyen."
              erreur={erreurs.duree}
              sous={
                <div className="suggestions" role="group" aria-label="Durées courantes">
                  {DUREES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      className="suggestion"
                      aria-pressed={v.duree === String(d)}
                      onClick={() => changer('duree', String(d))}
                    >
                      {d < 60 ? `${d} min` : `${Math.floor(d / 60)} h${d % 60 ? ` ${d % 60}` : ''}`}
                    </button>
                  ))}
                </div>
              }
            />
            <label className="case">
              <input type="checkbox" name="gratuit" checked={v.gratuit} onChange={(e) => changer('gratuit', e.target.checked)} />
              <span>Offre gratuite</span>
            </label>
            {!v.gratuit && (
              <Champ
                libelle="Prix (en euros)"
                name="prix"
                inputMode="decimal"
                required
                placeholder="Ex. : 8,50"
                value={v.prix}
                onChange={(e) => changer('prix', e.target.value)}
                aide="Prix le plus bas proposé (tarif plein ou réduit)."
                erreur={erreurs.prix}
              />
            )}
          </Section>

          <Section numero={4} titre="Photo et version anglaise" aide="Facultatif, mais une photo rend l’offre bien plus visible">
            <Champ
              libelle="Adresse de la photo"
              name="photoUrl"
              type="url"
              inputMode="url"
              placeholder="https://…"
              value={v.photoUrl}
              onChange={(e) => changer('photoUrl', e.target.value)}
              aide="Lien vers une image en ligne dont vous détenez les droits."
              erreur={erreurs.photoUrl}
            />
            {v.photoUrl.trim() && (
              <>
                <Champ
                  libelle="Crédit photo"
                  name="photoCredit"
                  required
                  maxLength={200}
                  placeholder="Ex. : © Musée Exemple"
                  value={v.photoCredit}
                  onChange={(e) => changer('photoCredit', e.target.value)}
                  aide="Affiché sous la photo (droit d’auteur)."
                  erreur={erreurs.photoCredit}
                />
                <Champ
                  libelle="Description de la photo"
                  name="photoAlt"
                  required
                  maxLength={300}
                  placeholder="Ex. : Salle d’exposition avec des tableaux anciens"
                  value={v.photoAlt}
                  onChange={(e) => changer('photoAlt', e.target.value)}
                  aide="Lue aux personnes aveugles ou malvoyantes : décrivez ce qu’on voit."
                  erreur={erreurs.photoAlt}
                />
              </>
            )}
            <hr className="separateur" />
            <p className="t-corps secondaire">
              Sans version anglaise, AiCity traduit automatiquement votre offre quand c’est possible.
            </p>
            <Champ
              libelle="Titre en anglais"
              name="titreEn"
              lang="en"
              maxLength={150}
              value={v.titreEn}
              onChange={(e) => changer('titreEn', e.target.value)}
              erreur={erreurs.titreEn}
            />
            <Champ
              libelle="Nom du lieu en anglais"
              name="lieuEn"
              lang="en"
              maxLength={200}
              value={v.lieuEn}
              onChange={(e) => changer('lieuEn', e.target.value)}
              erreur={erreurs.lieuEn}
            />
            <ZoneTexte
              libelle="Description en anglais"
              name="descriptionEn"
              lang="en"
              rows={4}
              maxLength={4000}
              value={v.descriptionEn}
              onChange={(e) => changer('descriptionEn', e.target.value)}
              erreur={erreurs.descriptionEn}
            />
          </Section>

          {probleme && <Alerte type="erreur">{probleme}</Alerte>}

          <div className="actions-formulaire">
            <Link to="/offres" className="bouton bouton-secondaire">
              Annuler
            </Link>
            <button type="submit" className="bouton bouton-primaire" disabled={enCours} aria-busy={enCours}>
              {enCours ? 'Envoi…' : 'Envoyer pour vérification'}
            </button>
          </div>
        </form>

        <aside className="apercu" aria-label="Aperçu de l’offre dans l’appli AiCity">
          <p className="t-legende secondaire">Aperçu dans l’appli AiCity</p>
          <div className="carte apercu-carte">
            {v.photoUrl.trim() && !erreurs.photoUrl ? (
              <img src={v.photoUrl.trim()} alt="" className="apercu-photo" />
            ) : (
              <div className="apercu-photo apercu-photo-vide">{IconeApercu && <IconeApercu size={32} aria-hidden="true" />}</div>
            )}
            <div className="apercu-texte">
              <p className="t-legende secondaire">{libelleCategorie ?? 'Catégorie'}</p>
              <p className="t-corps-fort">{v.titre.trim() || 'Titre de votre offre'}</p>
              <p className="t-legende secondaire apercu-ligne">
                <MapPin size={14} aria-hidden="true" />
                {v.lieu.trim() || 'Nom du lieu'}
              </p>
              <p className="t-legende apercu-ligne chiffres">
                <Clock size={14} aria-hidden="true" />
                {v.duree ? `${v.duree} min` : '—'}
                {prixApercu && ` · ${prixApercu}`}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
