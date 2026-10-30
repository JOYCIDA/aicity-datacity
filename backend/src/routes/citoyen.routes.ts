import { Router } from 'express';
import * as compte from '../controllers/compteCitoyen.controller.js';
import * as offresPubliques from '../controllers/offrePublique.controller.js';
import * as recommandation from '../controllers/recommandation.controller.js';
import * as session from '../controllers/session.controller.js';
import * as signalement from '../controllers/signalement.controller.js';
import {
  citoyenOuSession,
  exigerRole,
  exigerSession,
  sessionSiPresente,
  verifierJwt,
} from '../middlewares/auth.middleware.js';
import { env } from '../config/env.js';
import { exigerBorne } from '../middlewares/borne.middleware.js';
import { limiter } from '../middlewares/rateLimit.middleware.js';

export const citoyenRouter = Router();

// Consultation ouverte : les bornes et les visiteurs sans compte doivent voir les offres validées.
// Envoyé par une borne, le jeton de session fait de chaque consultation une activité (RG1).
citoyenRouter.get('/questions', sessionSiPresente, recommandation.questions);
citoyenRouter.get('/offres', sessionSiPresente, offresPubliques.lister);
citoyenRouter.get('/offres/:id', sessionSiPresente, offresPubliques.detail);
citoyenRouter.post('/interpretations', sessionSiPresente, recommandation.interpreter);

// Mode mobile (jeton CITOYEN) ou mode borne (jeton de session, position de la borne).
citoyenRouter.post('/recommandations', citoyenOuSession, recommandation.recommander);

// Mobile sans compte : session anonyme, sans rien stocker (limitée par adresse IP).
citoyenRouter.post('/sessions/anonyme', limiter(env.SESSIONS_ANONYMES_MAX, 15), session.ouvrirAnonyme);

// Signalement d'un problème sur une offre : compte, borne ou session anonyme ; sans identité.
citoyenRouter.post('/signalement', limiter(env.SIGNALEMENTS_MAX, 60), citoyenOuSession, signalement.signaler);

// Sessions de borne (UC1) : ouverture avec la clé de la borne, puis jeton de session.
citoyenRouter.post('/sessions', exigerBorne, session.ouvrir);
citoyenRouter.get('/sessions/:id', exigerSession, session.etat);
citoyenRouter.delete('/sessions/:id', exigerSession, session.terminer);
citoyenRouter.post('/bornes/signal', exigerBorne, session.signal);

// Compte citoyen (UC10, UC19) : préférences, favoris, accès et effacement des données.
const citoyen = [verifierJwt, exigerRole('CITOYEN')];
citoyenRouter.get('/preferences', citoyen, compte.preferences);
citoyenRouter.put('/preferences', citoyen, compte.enregistrerPreferences);
citoyenRouter.get('/favoris', citoyen, compte.favoris);
citoyenRouter.post('/favoris', citoyen, compte.ajouterFavori);
citoyenRouter.delete('/favoris/:offreId', citoyen, compte.retirerFavori);
citoyenRouter.get('/mes-donnees', citoyen, compte.mesDonnees);
citoyenRouter.delete('/compte', citoyen, compte.supprimerCompte);
