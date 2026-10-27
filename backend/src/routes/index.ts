import { Router } from 'express';
import { santeRouter } from './sante.routes.js';

export const apiRouter = Router();

apiRouter.use('/sante', santeRouter);
