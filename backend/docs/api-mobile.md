# AiCity — brancher le mobile sans compte

Base : `http://<adresse-du-serveur>:4000/api` (voir `.env` pour `PORT`). Les réponses d'erreur ont
toutes la forme `{ "erreur": { "code", "message", "details"? } }` ; une donnée invalide renvoie 422.

## 1. Ouvrir une session anonyme

```http
POST /api/citoyen/sessions/anonyme
Content-Type: application/json

{ "langue": "FR" }            // facultatif, "FR" par défaut
```

`201` → `{ "jeton": "...", "expireLe": "2026-10-28T10:30:00.000Z", "langue": "FR" }`

Rien n'est stocké côté serveur. Le jeton dure 30 minutes ; à l'expiration (401), rouvrir une session.
Limite : 300 ouvertures par adresse IP et par 15 minutes (réglable, `SESSIONS_ANONYMES_MAX`). Une session par
visite suffit : réutilisez le jeton jusqu'à son expiration.

## 2. Demander des recommandations

```http
POST /api/citoyen/recommandations
Authorization: Bearer <jeton>

{ "latitude": 48.8566, "longitude": 2.3522, "tempsLibreMinutes": 60,
  "budgetMax": 20, "categories": ["culture"], "rayonM": 2000, "langue": "FR" }
```

La position est obligatoire (la borne n'est pas là pour la fournir) et n'est jamais enregistrée.
La réponse a la même forme qu'avec un compte, sauf `rechercheId: null` (aucune recherche n'est conservée).
Le même en-tête `Authorization` fonctionne avec le jeton d'un compte CITOYEN (`/api/auth/connexion`).

## 3. Signaler un problème sur une offre

```http
POST /api/citoyen/signalement
Authorization: Bearer <jeton anonyme, CITOYEN ou de session borne>

{ "offreId": "<uuid>", "motif": "OFFRE_EXPIREE", "commentaire": "Fermé depuis hier" }
```

`motif` : `INFORMATION_ERRONEE`, `OFFRE_EXPIREE`, `LIEU_INCORRECT`, `CONTENU_INAPPROPRIE` ou `AUTRE`.
`commentaire` facultatif, 500 caractères maximum. `201` → `{ "signalement": { "id", "creeLe" } }`.
`404` si l'offre n'est pas visible. Aucune identité n'est enregistrée avec le signalement.
Limite : 20 signalements par adresse IP et par heure (réglable, `SIGNALEMENTS_MAX`).

## CORS

Les origines autorisées sont dans `CORS_ORIGINS` (séparées par des virgules). Elles ne concernent que
les navigateurs : une application native (Expo Go, APK) n'est pas soumise au CORS.

## 4. Langue du contenu des offres

`GET /api/citoyen/offres`, `GET /api/citoyen/offres/:id` et `GET /api/citoyen/favoris` acceptent `?langue=fr|en`
(casse libre). `POST /api/citoyen/recommandations` utilise le champ `langue` du corps, comme pour l'explication.
Sans paramètre, une session de borne utilise sa propre langue, sinon le français.

Les champs `titre`, `description` et `lieu` sont rendus dans la langue demandée. Quand une traduction manque, le
français sert de repli champ par champ. Chaque offre porte :

- `langue` : `"FR"` ou `"EN"`, la langue demandée ;
- `traduit` : `false` si un de ces champs est resté en français alors que l'anglais était demandé (l'interface peut
  l'indiquer, par exemple par une petite mention « FR »).

Les traductions viennent de trois endroits : la source quand elle les fournit (OpenAgenda), l'entreprise (champs
facultatifs `titreEn`, `descriptionEn`, `lieuEn` à la création ou modification d'une offre), puis la traduction
automatique après chaque import (`TRADUCTION_FOURNISSEUR=deepl` dans `.env`, ou `npm run traduire`).

## 5. Photos : crédit et description

Chaque offre renvoie `photoUrl`, `photoCredit` (à afficher sous la photo : droit d'auteur) et `photoAlt` (texte
alternatif pour les lecteurs d'écran). Les deux derniers peuvent être `null` : ne rien afficher dans ce cas.

## 6. Temps libre et durée des offres

Une offre n'est proposée que si trajet à pied + durée ≤ temps libre. Les offres importées dont la source ne donne pas
de durée prennent la durée par défaut de leur catégorie (15 à 20 min). Le choix « 30 min » donne donc des résultats
dans un rayon d'environ 10 minutes de marche.
