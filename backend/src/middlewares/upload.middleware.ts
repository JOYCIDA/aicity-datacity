import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { open, unlink } from 'node:fs/promises';
import path from 'node:path';
import type { RequestHandler } from 'express';
import multer from 'multer';
import { env } from '../config/env.js';
import { badRequest, tooLarge, unsupportedMediaType } from '../utils/errors.js';

export const TAILLE_MAX_JUSTIFICATIF = 5 * 1024 * 1024;

// Type MIME accepté → extension enregistrée et signature attendue en tête de fichier.
const TYPES_JUSTIFICATIF: Record<string, { ext: string; signature: (b: Buffer) => boolean }> = {
  'application/pdf': { ext: '.pdf', signature: (b) => b.subarray(0, 5).toString('latin1') === '%PDF-' },
  'image/jpeg': { ext: '.jpg', signature: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': {
    ext: '.png',
    signature: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  'image/webp': {
    ext: '.webp',
    signature: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
  },
};

export const SOUS_DOSSIER_JUSTIFICATIFS = 'justificatifs';
const dossier = path.resolve(env.UPLOAD_DIR, SOUS_DOSSIER_JUSTIFICATIFS);

const recepteur = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      mkdirSync(dossier, { recursive: true });
      cb(null, dossier);
    },
    // Nom aléatoire : le nom d'origine n'est jamais réutilisé côté disque.
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${TYPES_JUSTIFICATIF[file.mimetype]!.ext}`),
  }),
  limits: { fileSize: TAILLE_MAX_JUSTIFICATIF, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype in TYPES_JUSTIFICATIF) cb(null, true);
    else cb(unsupportedMediaType('Justificatif attendu au format PDF, JPEG, PNG ou WebP'));
  },
}).single('justificatif');

const recevoir: RequestHandler = (req, res, next) => {
  recepteur(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      next(
        err.code === 'LIMIT_FILE_SIZE'
          ? tooLarge('Le justificatif dépasse 5 Mo')
          : badRequest(`Envoi invalide : ${err.message}`),
      );
      return;
    }
    if (err) {
      next(err);
      return;
    }
    if (!req.file) {
      next(badRequest('Fichier « justificatif » manquant (multipart/form-data)'));
      return;
    }
    next();
  });
};

/** Le type MIME vient du client : on contrôle aussi les premiers octets du fichier. */
const verifierSignature: RequestHandler = async (req, _res, next) => {
  const fichier = req.file!;
  const descripteur = await open(fichier.path, 'r');
  const entete = Buffer.alloc(12);
  try {
    await descripteur.read(entete, 0, entete.length, 0);
  } finally {
    await descripteur.close();
  }
  if (!TYPES_JUSTIFICATIF[fichier.mimetype]!.signature(entete)) {
    await unlink(fichier.path).catch(() => {});
    next(unsupportedMediaType('Le contenu du fichier ne correspond pas à son type'));
    return;
  }
  next();
};

export const televerserJustificatif = [recevoir, verifierSignature];
