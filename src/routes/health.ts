import { healthController } from '@auth/controllers/health';
import express, { Router } from 'express';

const router: Router = express.Router();

export const healthRoutes = (): Router => {
  router.get('/auth-health', healthController.health);
  return router;
};
