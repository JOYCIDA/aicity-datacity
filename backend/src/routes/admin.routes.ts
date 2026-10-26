import { Router } from 'express';
import * as moderation from '../controllers/adminModeration.controller.js';
import { exigerRole, verifierJwt } from '../middlewares/auth.middleware.js';

export const adminRouter = Router();

adminRouter.use(verifierJwt, exigerRole('ADMIN'));

adminRouter.get('/entreprises', moderation.listerEntreprises);
adminRouter.get('/entreprises/:id', moderation.detailEntreprise);
adminRouter.get('/entreprises/:id/justificatif', moderation.justificatif);
adminRouter.patch('/entreprises/:id/decision', moderation.deciderEntreprise);

adminRouter.get('/offres', moderation.listerOffres);
adminRouter.patch('/offres/:id/decision', moderation.deciderOffre);
