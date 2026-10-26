import bcrypt from 'bcryptjs';
import { prisma } from '../prisma/client.js';
import { env } from '../config/env.js';
import { conflict, notFound, unauthorized } from '../utils/errors.js';
import { signerToken } from '../utils/jwt.js';
import type { ConnexionDto, InscriptionDto } from '../schemas/auth.schema.js';

const COUT_BCRYPT = env.NODE_ENV === 'test' ? 4 : 12;
// Hash factice : on compare toujours, même si l'e-mail n'existe pas, pour que le
// temps de réponse ne révèle pas si un compte existe.
const HASH_FACTICE = bcrypt.hashSync('mot-de-passe-factice', COUT_BCRYPT);

const selectionPublique = { id: true, email: true, role: true, langue: true } as const;

function estContrainteUnique(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002';
}

export async function inscrire(dto: InscriptionDto) {
  const existant = await prisma.utilisateur.findUnique({ where: { email: dto.email } });
  if (existant) throw conflict('Cette adresse e-mail est déjà utilisée');

  const motDePasseHash = await bcrypt.hash(dto.motDePasse, COUT_BCRYPT);
  try {
    const utilisateur = await prisma.utilisateur.create({
      data: {
        email: dto.email,
        motDePasseHash,
        role: dto.role,
        langue: dto.langue,
        // RG5/RG8 : un compte entreprise naît EN_ATTENTE (valeur par défaut du schéma).
        ...(dto.role === 'ENTREPRISE' ? { entreprise: { create: dto.entreprise } } : {}),
      },
      select: selectionPublique,
    });
    return { token: signerToken(utilisateur), utilisateur };
  } catch (err) {
    if (estContrainteUnique(err)) throw conflict('Cette adresse e-mail est déjà utilisée');
    throw err;
  }
}

export async function connecter(dto: ConnexionDto) {
  const trouve = await prisma.utilisateur.findUnique({ where: { email: dto.email } });
  const valide = await bcrypt.compare(dto.motDePasse, trouve?.motDePasseHash ?? HASH_FACTICE);
  if (!trouve || !valide) throw unauthorized('Identifiants invalides');

  const utilisateur = {
    id: trouve.id,
    email: trouve.email,
    role: trouve.role,
    langue: trouve.langue,
  };
  return { token: signerToken(utilisateur), utilisateur };
}

export async function moi(utilisateurId: string) {
  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id: utilisateurId },
    select: {
      ...selectionPublique,
      creeLe: true,
      entreprise: { select: { id: true, nom: true, statut: true, motifRefus: true } },
    },
  });
  if (!utilisateur) throw notFound('Compte introuvable');
  return utilisateur;
}
