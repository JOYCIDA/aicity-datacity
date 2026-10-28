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
Limite : 30 ouvertures par adresse IP et par 15 minutes.

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
Limite : 20 signalements par adresse IP et par heure.

## CORS

Les origines autorisées sont dans `CORS_ORIGINS` (séparées par des virgules). Elles ne concernent que
les navigateurs : une application native (Expo Go, APK) n'est pas soumise au CORS.
