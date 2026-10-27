import { Router } from 'express';
import { adminRouter } from './admin.routes.js';
import { authRouter } from './auth.routes.js';
import { citoyenRouter } from './citoyen.routes.js';
import { entrepriseRouter } from './entreprise.routes.js';
import { santeRouter } from './sante.routes.js';

export const apiRouter = Router();

apiRouter.use('/sante', santeRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/entreprise', entrepriseRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/citoyen', citoyenRouter);
