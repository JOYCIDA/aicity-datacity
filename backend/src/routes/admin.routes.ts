import { Router } from 'express';
import * as bornes from '../controllers/adminBorne.controller.js';
import * as imports from '../controllers/adminImport.controller.js';
import * as moderation from '../controllers/adminModeration.controller.js';
import * as signalements from '../controllers/signalement.controller.js';
import { exigerRole, verifierJwt } from '../middlewares/auth.middleware.js';

export const adminRouter = Router();

adminRouter.use(verifierJwt, exigerRole('ADMIN'));

adminRouter.get('/entreprises', moderation.listerEntreprises);
adminRouter.get('/entreprises/:id', moderation.detailEntreprise);
adminRouter.get('/entreprises/:id/justificatif', moderation.justificatif);
adminRouter.patch('/entreprises/:id/decision', moderation.deciderEntreprise);

adminRouter.get('/offres', moderation.listerOffres);
adminRouter.patch('/offres/:id/decision', moderation.deciderOffre);
adminRouter.get('/journal', moderation.journal);

adminRouter.get('/signalements', signalements.lister);
adminRouter.patch('/signalements/:id', signalements.traiter);

// Supervision (UC16) : état des bornes et derniers imports.
adminRouter.get('/bornes/supervision', bornes.supervision);
adminRouter.get('/imports/derniers', imports.derniers);

adminRouter.get('/bornes', bornes.lister);
adminRouter.post('/bornes', bornes.creer);
adminRouter.patch('/bornes/:id', bornes.modifier);
adminRouter.post('/bornes/:id/cle', bornes.renouvelerCle);

adminRouter.get('/imports', imports.lister);
adminRouter.post('/imports/:source/lancer', imports.lancer);
