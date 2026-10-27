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
