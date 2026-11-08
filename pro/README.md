# AiCity Pro

Espace web des entreprises : inscription, connexion, puis publication et suivi des offres qui alimentent les recommandations d'AiCity. Site pour ordinateur, distinct de l'appli citoyen (`frontend/`).

Technologies : React, Vite, TypeScript, React Router. Polices Instrument Sans et Space Grotesk (logo), hébergées avec le site.

## Lancer en local

1. Démarrer le backend (`backend/`) avec `npm run dev`, sur le port 4000.
2. Dans ce dossier :

```powershell
npm install
npm run dev
```

3. Ouvrir http://localhost:5173.

Le port 5173 est celui que le backend autorise (`CORS_ORIGINS`). Pour utiliser une autre API, copier `.env.example` en `.env.local` et changer `VITE_API_URL`.

## Organisation

- `src/api.ts` : appels à l'API, jeton de connexion, erreurs.
- `src/auth.tsx` : session de l'entreprise connectée.
- `src/composants/` : éléments réutilisables (champ, alerte, logo, mises en page).
- `src/pages/` : une page par écran.
- `src/styles.css` : couleurs, échelle typographique et composants, alignés sur `frontend/src/theme.ts`.
