import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

export const hashMotDePasse = (motDePasse: string) => bcrypt.hash(motDePasse, env.BCRYPT_COST);

export const verifierMotDePasse = (motDePasse: string, hash: string) =>
  bcrypt.compare(motDePasse, hash);

// Hash factice : on le compare quand l'e-mail n'existe pas, pour que la réponse
// prenne le même temps et ne révèle pas quels comptes existent.
let factice: Promise<string> | undefined;
export const hashFactice = () => (factice ??= hashMotDePasse('mot-de-passe-factice'));
