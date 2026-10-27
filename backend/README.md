# AiCity — Backend

API Express 5 + TypeScript + Prisma 7 + PostgreSQL.

## Démarrage

```powershell
npm install
copy .env.example .env      # puis renseigner DATABASE_URL et JWT_SECRET
npx prisma generate
npx prisma migrate dev --name init
npm run dev
curl.exe http://localhost:4000/api/sante
```

## Scripts

| Script | Rôle |
|---|---|
| `npm run dev` | serveur avec rechargement (tsx) |
| `npm run build` / `npm start` | compilation puis exécution de `dist/` |
| `npm run typecheck` | vérification des types |
| `npm test` | tests vitest |
| `npm run prisma:migrate` | nouvelle migration en développement |
| `npm run seed` | six catégories + administrateur (`ADMIN_EMAIL` / `ADMIN_MOT_DE_PASSE`) |

## Tests

`test/integration/parcours-entreprise.test.ts` joue la séquence 06 sur une vraie base
PostgreSQL : `TEST_DATABASE_URL` (par défaut `aicity_test`), **vidée** à chaque exécution.
Créez-la une fois avec `createdb -U aicity aicity_test` ; les migrations sont appliquées
par le test. Si la base est injoignable, ce fichier est ignoré et les autres tests passent.

## Entreprises et modération (lot L2)

| Méthode | Route | Rôle |
|---|---|---|
| GET / PATCH | `/api/entreprise/profil` | ENTREPRISE |
| POST | `/api/entreprise/justificatif` (multipart, champ `justificatif`, PDF/JPEG/PNG/WebP, 5 Mo) | ENTREPRISE |
| GET / POST | `/api/entreprise/offres` | ENTREPRISE (POST : compte ACTIF, RG8) |
| GET / PATCH | `/api/entreprise/offres/:id` | ENTREPRISE propriétaire (RG16) |
| PATCH | `/api/entreprise/offres/:id/statut` (`EN_PAUSE` ↔ `VALIDE`) | ENTREPRISE propriétaire |
| GET | `/api/admin/entreprises?statut=EN_ATTENTE` | ADMIN |
| GET | `/api/admin/entreprises/:id` et `/:id/justificatif` | ADMIN |
| PATCH | `/api/admin/entreprises/:id/decision` (`VALIDE`, `REFUSE`, `SUSPENDU`, `REACTIVE`) | ADMIN |
| GET | `/api/admin/offres?statut=EN_ATTENTE` | ADMIN |
| PATCH | `/api/admin/offres/:id/decision` (`VALIDE`, `REFUSE` + motif) | ADMIN |
| GET | `/api/citoyen/offres` | public |

## Compte citoyen, statistiques, supervision (lot L7)

| Méthode | Route | Accès |
|---|---|---|
| GET / PUT | `/api/citoyen/preferences` `{ categories, budgetMax, langue? }` (PUT remplace tout) | CITOYEN |
| GET / POST | `/api/citoyen/favoris` `{ offreId }` (201, ou 200 si déjà en favori) | CITOYEN |
| DELETE | `/api/citoyen/favoris/:offreId` (204, idempotent) | CITOYEN |
| GET | `/api/citoyen/mes-donnees` (export RGPD, en pièce jointe) | CITOYEN |
| DELETE | `/api/citoyen/compte` `{ motDePasse }` (204 ; 403 si mot de passe faux) | CITOYEN |
| GET | `/api/entreprise/statistiques?jours=30` | ENTREPRISE |
| GET | `/api/admin/bornes/supervision` (dernier signal, hors ligne en tête) | ADMIN |
| GET | `/api/admin/imports/derniers` (dernier rapport et alerte par source) | ADMIN |
| GET | `/api/admin/journal?decision=&offreId=&entrepriseId=&du=&au=` | ADMIN |
| POST | `/api/citoyen/bornes/signal` (signal de vie, chaque minute) | en-tête `X-Borne-Key` |

**RGPD.** Supprimer le compte efface en cascade préférences, favoris, recherches et
recommandations ; seuls restent les compteurs anonymes `StatOffreJour`. Le jeton reste
techniquement valide jusqu'à son expiration, mais toute route qui touche au compte répond alors
401 « Compte supprimé ».

**Statistiques (RG19).** Calculées sur les seules offres de l'entreprise connectée, à partir des
compteurs quotidiens (vues, recommandations, favoris), désormais alimentés aux trois endroits.
Regroupements par statut, catégorie, créneau de début (heure de Paris) et tranche de budget
(mêmes paliers que la question posée au citoyen), tous présents même à zéro.

**Supervision.** Le job de chaque minute passe `HORS_LIGNE` une borne active sans signal depuis
5 min ; un signal ou une ouverture de session la remet `ACTIVE`.

## Bornes et sessions (lot L5)

| Méthode | Route | Accès |
|---|---|---|
| GET / POST | `/api/admin/bornes` (POST renvoie la clé **une seule fois**, RG17) | ADMIN |
| PATCH | `/api/admin/bornes/:id` (`DESACTIVEE` ferme ses sessions) | ADMIN |
| POST | `/api/admin/bornes/:id/cle` (nouvelle clé, l'ancienne cesse de fonctionner) | ADMIN |
| POST | `/api/citoyen/sessions` `{ langue? }` → `{ session, jeton }` | en-tête `X-Borne-Key` |
| GET / DELETE | `/api/citoyen/sessions/:id` | jeton de session |

La base ne garde que l'empreinte SHA-256 des clés. Une session expire après 60 s sans appel, et
au plus tard 10 min après son ouverture (RG1) : chaque appel portant le jeton repousse l'échéance
(en-tête `X-Session-Expire-Le`), y compris sur les routes publiques. Une session échue est
supprimée par l'appel qui la découvre (401) ou par la purge, chaque minute ; recherches et
recommandations partent avec elle. En mode borne, la recommandation utilise la position de la
borne (RG2).

**Contrat pour le frontend** : la collection Bruno [`docs/api-aicity`](../docs/api-aicity/README.md)
couvre toutes les routes et se joue de bout en bout (`npx @usebruno/cli run --env local -r`).

## Recommandation (lot L4)

| Méthode | Route | Accès |
|---|---|---|
| GET | `/api/citoyen/questions` | public |
| POST | `/api/citoyen/recommandations` `{ latitude, longitude, tempsLibreMinutes, budgetMax?, categories?, rayonM?, langue? }` | CITOYEN (mode mobile) |
| POST | `/api/citoyen/interpretations` `{ texte }` (texte jamais enregistré, RG3) | public |
| GET | `/api/citoyen/offres?latitude=&longitude=&rayonM=&categorie=` (carte) | public |
| GET | `/api/citoyen/offres/:id` (fiche, compte une vue) | public |

Déroulé : préfiltre SQL (boîte englobante du rayon doublé, offres visibles) → filtres purs
(`filtre.service.ts` : statut, catégories, budget, rayon, créneau) → si moins de 3 offres, rayon
doublé une fois (RG12, `elargie: true`) → notation sur 9 et tri (`scoring.service.ts`, RG13) →
5 meilleures, enregistrées avec la recherche (sans la position).

Le barème est dans `src/config/scoring.ts`. **Il est provisoire** : la section 7.2 de l'analyse
n'était pas disponible au lot L4 ; seul ce fichier est à modifier pour appliquer le barème officiel.

## Import des données publiques (lot L3)

Chaque nuit à 3 h (`CRON_IMPORT`), les sources configurées sont importées l'une après l'autre ;
une source en panne (rapport `ECHEC`) n'empêche pas les suivantes. Les offres importées sont
directement `VALIDE` et repérées par `(source, idExterne)` : relancer un import met à jour
sans créer de doublon. Les offres dont la fin est dépassée passent en `EXPIREE`.

| Source (`:source`) | Clé | Données |
|---|---|---|
| `parisopendata` | non | « Que faire à Paris ? », export complet en une requête |
| `openagenda` | `OPENAGENDA_API_KEY` + `OPENAGENDA_AGENDAS` | API v2, pagination `after` |
| `datagouv` | non | ressource JSON d'un jeu data.gouv.fr (export OpenAgenda, GPSO par défaut) |

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/api/admin/imports/:source/lancer` → 202 + rapport `EN_COURS` (409 si déjà en cours ou non configurée) | ADMIN |
| GET | `/api/admin/imports?source=PARIS_OPEN_DATA` | ADMIN |

Un événement est rejeté (et compté) s'il manque le titre, le lieu, les coordonnées ou la date ;
il est ignoré sans être compté s'il est annulé, en ligne ou déjà terminé. Le détail figure dans
le `message` du rapport. Les jeux d'essai de `data/` (réponses réelles pour Paris et data.gouv.fr,
jeu construit d'après la documentation pour OpenAgenda) servent aux tests, sans réseau.
