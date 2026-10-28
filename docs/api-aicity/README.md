# Collection Bruno — API AiCity

Contrat d’API entre le backend et le frontend (mobile et borne). Chaque requête est un fichier
`.bru` lisible ; l’onglet **Docs** de chaque requête décrit les champs, les règles et les erreurs.

## Démarrer

1. Installer [Bruno](https://www.usebruno.com/) (application de bureau, gratuite).
2. *Open Collection* → choisir ce dossier `docs/api-aicity`.
3. Sélectionner l’environnement **local** (en haut à droite).
4. Côté backend, l’API doit tourner (`npm run dev` dans `backend/`) avec un administrateur créé
   par le seed, avec les mêmes identifiants que l’environnement :

   ```powershell
   $env:ADMIN_EMAIL="admin@aicity.local"; $env:ADMIN_MOT_DE_PASSE="admin-aicity-dev"; npm run seed
   ```

Les requêtes s’enchaînent : chacune enregistre ce dont les suivantes ont besoin (jetons, clé de
borne, identifiants). Pour tout jouer d’un coup : clic droit sur la collection → **Run**, ou en
ligne de commande `npx @usebruno/cli run --env local -r` depuis ce dossier. Les comptes de test
ont une adresse unique à chaque passage, la collection peut donc être rejouée.

## Trois façons de s’authentifier

| Qui | Comment | Obtenu par |
|---|---|---|
| Compte (citoyen, entreprise, admin) | `Authorization: Bearer <token>` | `POST /auth/inscription` ou `/auth/connexion` |
| Borne (ouvrir une session) | en-tête `X-Borne-Key: <clé>` | `POST /admin/bornes` (clé montrée **une seule fois**) |
| Usager à la borne | `Authorization: Bearer <jeton>` | `POST /citoyen/sessions` |

## Parcours borne (séquence 05)

1. Un usager approche → `POST /citoyen/sessions` avec `X-Borne-Key` → `jeton`.
2. Questions, interprétation, recommandations, fiches : toujours avec le `jeton`.
   La recommandation utilise **la position de la borne** ; ne pas en envoyer.
3. **Inactivité** : la session meurt après **60 s sans appel**, et au plus tard **10 min** après
   son ouverture. Chaque appel repousse l’échéance, lue dans l’en-tête **`X-Session-Expire-Le`**.
   Si l’usager lit une fiche sans rien toucher, appeler `GET /citoyen/sessions/:id` à chaque
   interaction tactile pour garder la session ouverte.
4. Réponse **`401`** sur n’importe quel appel → session terminée : revenir à l’écran d’accueil.
5. Bouton « Terminer » → `DELETE /citoyen/sessions/:id` (`204`) : tout est effacé.

En plus, **chaque minute et même sans usager**, la borne appelle `POST /citoyen/bornes/signal`
avec `X-Borne-Key` : sans signal depuis 5 min, elle apparaît hors ligne dans la supervision.

## Compte citoyen (mobile)

- Préférences : `PUT` remplace l’ensemble ; les catégories préférées orientent la notation.
- Favoris : un favori dont l’offre n’est plus proposée revient avec `disponible: false`.
- Suppression du compte : demander le mot de passe. Un mot de passe faux renvoie `403` (ne pas
  déconnecter) ; après `204`, oublier le jeton, qui reçoit désormais `401`.

## Erreurs

Toujours le même format :

```json
{ "erreur": { "code": "VALIDATION", "message": "Données invalides", "details": [ … ] } }
```

| Statut | `code` | Quand |
|---|---|---|
| 400 | `REQUETE_INVALIDE` | requête mal formée (fichier manquant…) |
| 401 | `NON_AUTHENTIFIE` | jeton absent, invalide, session expirée, ou compte supprimé |
| 403 | `INTERDIT` | rôle non autorisé, ressource d’un autre, borne désactivée, compte entreprise non validé, mot de passe de confirmation faux |
| 404 | `INTROUVABLE` | ressource absente ou non visible |
| 409 | `CONFLIT` | action impossible dans l’état actuel (décision déjà prise, import en cours…) |
| 413 / 415 | `TROP_VOLUMINEUX` / `TYPE_NON_SUPPORTE` | justificatif > 5 Mo, ou ni PDF ni image |
| 422 | `VALIDATION` | champ invalide ; `details` liste les champs en cause |

## Bon à savoir

- Dates en ISO 8601 (UTC), montants en euros (nombre, centimes autorisés), distances en mètres.
- Textes affichables en deux langues : `libelle.FR` / `libelle.EN`, et `langue` (`FR` | `EN`)
  dans les requêtes de recommandation et de session.
- Le barème des recommandations (`score` sur `scoreMax` = 9) est **provisoire** ; seule la valeur
  des scores pourra changer, pas la forme des réponses.
