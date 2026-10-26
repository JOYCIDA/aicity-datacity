import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { santeRouter } from './sante.routes.js';

export const apiRouter = Router();

apiRouter.use('/sante', santeRouter);
apiRouter.use('/auth', authRouter);
