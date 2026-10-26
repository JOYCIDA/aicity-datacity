import { Router } from 'express';
import * as offresPubliques from '../controllers/offrePublique.controller.js';

export const citoyenRouter = Router();

// Consultation ouverte : les bornes et les visiteurs sans compte doivent voir les offres validées.
citoyenRouter.get('/offres', offresPubliques.lister);
