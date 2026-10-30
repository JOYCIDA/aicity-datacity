import 'dotenv/config';
import cron from 'node-cron';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL est obligatoire'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),
  UPLOAD_DIR: z.string().default('uploads'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET doit faire au moins 32 caractères'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_COST: z.coerce.number().int().min(4).max(15).default(12),

  // --- Import des données publiques (lot L3) ---
  IMPORT_PLANIFIE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  CRON_IMPORT: z
    .string()
    .default('0 3 * * *')
    .refine((v) => cron.validate(v), 'CRON_IMPORT n’est pas une expression cron valide'),
  OPENAGENDA_API_KEY: z.string().optional(),
  OPENAGENDA_AGENDAS: z
    .string()
    .default('')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),
  // --- Limites par adresse IP (routes publiques sans compte) ---
  // Nombre d'ouvertures de session anonyme par IP et par fenêtre de 15 minutes. Large par défaut :
  // un Wi-Fi d'école ou un opérateur 4G fait partager une même IP à beaucoup d'usagers.
  SESSIONS_ANONYMES_MAX: z.coerce.number().int().min(1).default(300),
  // Signalements d'offres par IP et par heure.
  SIGNALEMENTS_MAX: z.coerce.number().int().min(1).default(20),
  // Nombre de proxys de confiance devant l'API (0 : aucun). Derrière Nginx, mettre 1 : sans cela,
  // tous les visiteurs auraient l'adresse de Nginx et partageraient la même limite.
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),

  // --- Traduction anglaise des offres importées ---
  // 'aucun' : les offres sans version anglaise restent en français (repli automatique).
  TRADUCTION_FOURNISSEUR: z.enum(['aucun', 'deepl']).default('aucun'),
  DEEPL_API_KEY: z.string().optional(),
  // URL de l'API DeepL ; par défaut déduite de la clé (« :fx » = offre gratuite).
  DEEPL_API_URL: z.string().optional(),
  // Plafond de caractères envoyés au traducteur par exécution (quota mensuel du fournisseur).
  TRADUCTION_MAX_CARACTERES: z.coerce.number().int().min(0).default(100_000),
  // Par défaut : « Événements de GPSO publiés sur Open Agenda » (Grand Paris Seine Ouest).
  DATAGOUV_DATASET: z.string().default('5de6fab49ce2e726bfb62c09'),
  DATAGOUV_RESSOURCE: z.string().default('f3e3c20e-4f57-4647-8185-83ade400b490'),
}).refine((v) => v.TRADUCTION_FOURNISSEUR !== 'deepl' || !!v.DEEPL_API_KEY, {
  message: 'DEEPL_API_KEY est obligatoire avec TRADUCTION_FOURNISSEUR=deepl',
  path: ['DEEPL_API_KEY'],
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Configuration invalide :');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')} : ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
