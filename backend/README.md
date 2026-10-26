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
