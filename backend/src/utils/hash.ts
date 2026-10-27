import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

export const hashMotDePasse = (motDePasse: string) => bcrypt.hash(motDePasse, env.BCRYPT_COST);

export const verifierMotDePasse = (motDePasse: string, hash: string) =>
  bcrypt.compare(motDePasse, hash);

// Hash factice : on le compare quand l'e-mail n'existe pas, pour que la réponse
// prenne le même temps et ne révèle pas quels comptes existent.
let factice: Promise<string> | undefined;
export const hashFactice = () => (factice ??= hashMotDePasse('mot-de-passe-factice'));

/**
 * RG17 : empreinte SHA-256 (hexadécimal) d'une clé d'API ; seule l'empreinte est stockée.
 * Un hachage lent (bcrypt) est inutile ici : la clé est aléatoire et longue, pas devinable.
 */
export const empreinteSha256 = (valeur: string) => createHash('sha256').update(valeur, 'utf8').digest('hex');

/** Clé de borne : 256 bits aléatoires, préfixés pour être reconnaissables dans une configuration. */
export const genererCleBorne = () => `borne_${randomBytes(32).toString('base64url')}`;
