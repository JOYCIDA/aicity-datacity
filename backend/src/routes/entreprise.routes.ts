import { Router } from 'express';
import * as offres from '../controllers/entrepriseOffre.controller.js';
import * as profil from '../controllers/entrepriseProfil.controller.js';
import * as stats from '../controllers/stats.controller.js';
import * as upload from '../controllers/upload.controller.js';
import { exigerRole, verifierJwt } from '../middlewares/auth.middleware.js';
import { televerserJustificatif } from '../middlewares/upload.middleware.js';

export const entrepriseRouter = Router();

// RG15 : tout l'espace est réservé aux comptes entreprise.
entrepriseRouter.use(verifierJwt, exigerRole('ENTREPRISE'));

entrepriseRouter.get('/profil', profil.profil);
entrepriseRouter.patch('/profil', profil.modifierProfil);
entrepriseRouter.post('/justificatif', televerserJustificatif, upload.justificatif);

entrepriseRouter.get('/offres', offres.lister);
entrepriseRouter.post('/offres', offres.creer);
entrepriseRouter.get('/offres/:id', offres.detail);
entrepriseRouter.patch('/offres/:id', offres.modifier);
entrepriseRouter.patch('/offres/:id/statut', offres.changerStatut);

// UC11 : comptages agrégés sur ses seules offres, sans donnée individuelle (RG19).
entrepriseRouter.get('/statistiques', stats.statistiques);
